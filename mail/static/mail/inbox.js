document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  document.querySelector('#compose-form').onsubmit = () = => {
    send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector(`#compose`).classList.add("selected");

  document.querySelectorAll("button").forEach(button => button.classList.remove("selected"));

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector(`#${mailbox}`).classList.add("selected");

  document.querySelectorAll("button").forEach(button => button.classList.remove("selected"));

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      const sections = [
        ['sender', 5], 
        ['subject', 3], 
        ['timestamp', 4]
      ];
      const artificial_first_email = {
        'sender': 'Sender',
        'subject':'Subject',
        'timestamp':'Time',
        'read':true
      };
      emails = [artificial_first_email, ...emails];
      emails.forEach(email => {
        const row_div_element = document.createElement('div');
        row_div_element.classList.add("row", "email-line-box", email["read"] ? "read":"unread");
        if (email === artificial_first_email) {
          row_div_element.id = 'titled-first-row';
        }
        sections.forEach(
          section => {
            const section_name = section[0];
            const section_size = section[1];
            const div_section = document.createElement('div');
            div_section.classList.add(`col-${section_size}`, `${section_name}-section`);
            div_section.innerHTML = `<p>${email[section_name]}</p>`;
            row_div_element.append(div_section);
          });
        if (email !== artificial_first_email) {
          row_div_element.addEventListener('click', () => load_email(email['id'], mailbox));
        }
        document.querySelector('#emails-view').append(row_div_element);
      
      })
    })
}

function send_email() {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({recipients: recipients,
      subject: subject,
      body, body
    })
  })
    .then(response => response.json())
      .then(result => {
        if ("message" in result) {
          load_mailbox('sent');
        }
        if ("error" in result) {
          document.querySelector('#to-text-error-message').innerHTML = result['error']
        }

      })
  return false;
}

function load_email(email_content, from_email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  document.querySelector('#email-content').innerHTML = '';
  document.querySelector('#email-back-section').innerHTML = '';

  fetch(`/emails/${email_content}`)
    .then(response => response.json())
    .then(email => {
      if("error" in email) {
        console.log(email)
      }
      ["subject", "timestamp", "sender", "recipients", "body"].forEach(email_element => {
        const div_row = document.createElement('div');
        div_row.classList.add("row", `email-${email_element}-section`);
        if (email_element === "subject") {
          const div_col_subject = document.createElement('div');
          div_col_subject.classList.add("col-8");
          div_col_subject.id = "email-subject-subsection";
          div_col_subject.innerHTML = `<p>${email[email_element]}</p>`;
          div_row.append(div_col_subject);

          const div_col_reply_archive = document.createElement('div');
          div_col_reply_archive.classList.add("col-4");
          div_col_reply_archive.id = "archive-reply-button";
          const data_for_potential_buttons_to_add = [
            ["Reply", () => reply_email(email)],
            [email["archived"] ? "Unarchive":"Archive",
              () => archive_email(email_content, !email["archived"] )]
          ];

          (from_email === "sent" ?
            data_for_potential_buttons_to_add.slice(0,1) : data_for_potential_buttons_to_add)
          .forEach(text_function => {
            const text = text_function[0];
            const callback_func = text_function[1];
            const button = document.createElement("button");
            button.classList.add("float-right");
            button.innerHTML = text;
            button.addEventListener('click', callback_func);
            div_col_reply_archive.append(button);
          });
          div_row.append(div_col_reply_archive);
        }else {
          div_row.innerHTML = `<p>${email[email_element]}</p>`;
        }
        document.querySelector("#email-content").append(div_row);
      });
      const back_button_row_div = document.createElement('div');
      back_button_row_div.classList.add("row");
      const back_button_col_div = document.createElement('div');
      back_button_col_div.classList.add("col-2", "offset-5");
      back_button_col_div.id = "back-button";
      back_button_col_div.innerHTML =
        `<p>${from_email.charAt(0).toUpperCase() + from_email.slice(1)}</p>`;
      back_button_col_div.addEventListener('click', () => load_mailbox(from_email));
      back_button_row_div.append(back_button_col_div);
      document.querySelector("#email-back-section").append(back_button_row_div);

    })
  
    fetch(`/emails/${email_content}`, {
      method: 'PUT',
      body: JSON.stringify({
        read:true
      })
    }).then();
}

function archive_email(email_content, to_archive) {
  fetch(`/emails/${email_content}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: to_archive
    })
  }).then( () => load_mailbox("inbox"));
}

function reply_email(email) {
  compose_email();
  document.querySelector('#compose-recipients').value = email["sender"];
  document.querySelector('#compose-subject').value = email["subject"].slice(0,4) === "Re: " ? email["subject"] : "Re: " + email["subject"];
  const pre_body_text = `\n \n \n------ On ${email['timestamp']} ${email["sender"]} wrote: \n \n`;
  document.querySelector('#compose-body').value = pre_body_text + email["body"].replace(/^/gm, "\t");
}
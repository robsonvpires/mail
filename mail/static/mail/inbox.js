document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = () => {
      
      const recipients = document.querySelector('#compose-recipients').value
      const subject = document.querySelector('#compose-subject').value;
      const body = document.querySelector('#compose-body').value;

      fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({recipients, subject, body})
      })
          .then(response => response.json())
          .then(result => {
              if (result.error) {
                  console.log(`error message: ${result.error}`);
              } else {
                  load_mailbox('sent');
              }
          })
          .catch(err => console.log(err))

      return false;
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(event, recipients = '', subject = '', body = '') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
    
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
  
  if (body.length > 0) {
    document.querySelector('#compose-body').focus();
  } else {
    document.querySelector('#compose-recipients').focus();
  }
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<div class="mailbox-title">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</div>`;

  // Load emails of user
  fetch(`/emails/${mailbox}`)
      .then(response => response.json())
      .then(emails => {
          emails.forEach(email => {
              const div = document.createElement("div");
              div.innerHTML = `
                  <div></div>
                  <span>${email.sender}</span>
                  <span>${email.subject}</span> 
                  <span>${email.timestamp}</span>`
              div.className = "mailbox-email"
              if (email.read) {
                  div.style.fontWeight = 'normal';
              }

              div.addEventListener('click', function() {

                  fetch(`/emails/${email.id}`)
                      .then(response => response.json())
                      .then(email => {
                          if (!email.read) {
                              fetch(`/emails/${email.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify({read: true})
                              })
                                  .then(response => {console.log(`PUT status for updating read state returned status code ${response.status}`)})
                          }
                          loadEmail(email, mailbox)
                      });
              })

              div.style.backgroundColor = "white";
              if (email.read) {
                div.style.backgroundColor = "lightgray";
              }
              document.querySelector("#emails-view").append(div)
          })
      });
}

function loadEmail(email_content, fromMailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  const subjectTitle = document.createElement("div");
  subjectTitle.innerHTML = email_content.subject;
  subjectTitle.className = 'subject-title';

  const detailedInfo = document.createElement("div");
  detailedInfo.style.fontSize = '14px'
  detailedInfo.style.marginBottom = '10px'
  detailedInfo.innerHTML = `
      <div>
          <span>From: </span>${email_content.sender}
          <span>${email_content.timestamp}<i></i></span>
      </div>
      <div>
          <span>To: </span>${email_content.recipients.join()}
      </div>
      <div>
          <span>Subject: </span>${email_content.subject}
      </div>
  `
  const fromLine = document.createElement("div");
  fromLine.innerHTML = `<span>From: </span>${email_content.sender}`;

  const toLine = document.createElement("div");
  toLine.innerHTML = `<span>To: </span>${email_content.recipients.join()}`;

  const subjectLine = document.createElement("div");
  subjectLine.innerHTML = `<span>Subject: </span>${email_content.subject}`;

  const timestampLine = document.createElement("div");
  timestampLine.innerHTML = `<span>Timestamp: </span>${email_content.timestamp}`;

  const bodySection = document.createElement("div");
  bodySection.innerText = email_content.body;
  bodySection.style.marginTop = '20px';

  const button_reply = document.createElement("button");
  button_reply.innerHTML = "<i></i>Reply";
  button_reply.className = "btn btn-sm btn-outline-primary";
  button_reply.addEventListener('click', function(event) {
      let subject = email_content.subject
      if (!email_content.subject.startsWith("Re: ")) {
        subject = `Re: ${subject}`
      }
      let body = `On ${email_content.timestamp} <${email_content.sender}> wrote:\n${email_content.body}\n--------\n`
      let recipient = email_content.sender;
      compose_email(event, recipient, subject, body)
  });

  document.querySelector('#email-view').innerHTML = "";
  document.querySelector('#email-view').append(subjectTitle)
  document.querySelector('#email-view').append(detailedInfo)
  document.querySelector('#email-view').append(button_reply)

  if (fromMailbox === "inbox") {
      const button_archive = document.createElement("button");
      button_archive.innerHTML = "<i></i>Archive"
      button_archive.className = "btn btn-sm btn-outline-primary"
      button_archive.addEventListener('click', function() {
          fetch(`/emails/${email_content.id}`, {
              method: 'PUT',
              body: JSON.stringify({archived: true})
          })
              .then(response => {
                  console.log(`PUT status for updating archive state returned status code ${response.status}`)
                  load_mailbox("inbox")
              })
      })
      document.querySelector('#email-view').append(button_archive)
  } else if (fromMailbox === "archive") {
      const button_unarchive = document.createElement("button");
      button_unarchive.innerHTML = "<i></i>Unarchive"
      button_unarchive.className = "btn btn-sm btn-outline-primary"
      button_unarchive.addEventListener('click', function() {
          fetch(`/emails/${email_content.id}`, {
              method: 'PUT',
              body: JSON.stringify({archived: false})
          })
              .then(response => {
                  console.log(`PUT status for updating archive state returned status code ${response.status}`)
                  load_mailbox("inbox")
              })
      })
      document.querySelector('#email-view').append(button_unarchive)
  }
  document.querySelector('#email-view').append(bodySection)
}
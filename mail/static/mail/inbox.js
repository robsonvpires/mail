document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  document.querySelector('#compose-form').onsubmit = () => {

    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({recipients, subject, body})
    })
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          console.log(`Error sending email: ${result.error}`);
        } 
        else {
          load_mailbox('sent');
        }
      })
    return false;
  }
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(event, recipients='', subject='', body='') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
  
  if (body.lenght > 0) {
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

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const div = document.createElement('div');
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
            .then(response => response.JSON())
            .then(email => {
              if (!email.read) {
                fetch(`/emails/${emai.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({read: true})
                })
                  .then(response => {
                    console.log(`PUT status ${response.status}`)
                  })
              }
              load_email(email, mailbox)
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

function load_email(emailData, fromMailbox) {
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  
  const subjectTitle = document.createElement("div");
  subjectTitle.innerHTML = emailData.subject;
  subjectTitle.className = 'subject-title';

  const detailedInfo = document.createElement("div");
  detailedInfo.style.fontSize = '14px'
  detailedInfo.style.marginBottom = '10px'
  detailedInfo.innerHTML = `
    <div>
      <span class="text-muted">From: </span>${emailData.sender}
      <span class="text-muted" style="float: right; font-size: 13px">${emailData.timestamp}<i style="margin-left: 16px"></i></span>
    </div>
    <div>
      <span class="text-muted">To: </span>${emailData.recipients.join()}
    </div>
    <div>
      <span class="text-muted">Content: </span>${emailData.subject}
    </div>
  `

  const fromLine = document.createElement("div");
  fromLine.innerHTML = `<span class="text-muted">From: </span>${emailData.sender}`;

  const toLine = document.createElement("div");
  toLine.innerHTML = `<span class="text-muted">To: </span>${emailData.recipients.join()}`;

  const subjectLine = document.createElement("div");
  subjectLine.innerHTML = `<span class="text-muted">Subjetc: </span>${emailData.subject}`;

  const timestampLine = document.createElement("div");
  timestampLine.innerHTML = `<span class="text-muted">Timestamp: </span>${emailData.timestamp}`;

  const bodySection = document.createElement("div");
  bodySection.innerText = emailData.body;
  bodySection.style.marginTop = '20px';

  const replyButton = document.createElement("button");
  replyButton.innerHTML = "<p>Reply</p>";
  replyButton.className = "btn";
  replyButton.addEventListener('click', function(event) {
    let subject = emailData.subject
    if (!emailData.subject.startsWith("Re: ")) {
      subject = `Re: ${subject}`
    }
    let body = `On ${emailData.timestamp} <${emailData.sender}> wrote: \n ${emailData.body} \n----------------\n`
    let recipient = emailData.sender;
    compose_email(event, recipient, subject, body)
  });
  
  document.querySelector('#email-view').innerHTML = "";
  document.querySelector('#email-view').append(subjectTitle)
  document.querySelector('#email-view').append(detailedInfo)
  document.querySelector('#email-view').append(replyButton)

  if (fromMailbox === "inbox") {
    const archiveButton = document.createElement("button");
    archiveButton.innerHTML = "<i class=\"fas fa-archive\" style=\"margin-right:5px\"></i>Archive"
    archiveButton.className = "btn btn-sm btn-outline-warning"
    archiveButton.addEventListener('click', function() {
      fetch(`/emails/${emailData.id}`, {
        method: 'PUT',
        body: JSON.stringify({archived: true})
      })
        .then(response => {
          console.log(`PUT status for updating archive state returned status code ${response.status}`)
          load_mailbox("inbox")
        })
    })
    document.querySelector('#email-view').append(archiveButton) 
  } else if (fromMailbox === "archive") {
    const unarchiveButton = document.createElement("button");
    unarchiveButton.innerHTML = "<i></i> Move to inbox"
    unarchiveButton.className = "btn btn-sm btn-outline-warning"
    unarchiveButton.addEventListener('click', function() {
      fetch(`/emails/${emailData.id}`, {
        method: 'PUT',
        body: JSON.stringify({archived: false})
      })
        .then(response => {
          console.log(`PUT status for updating archive state returned status code ${response.status}`)
          load_mailbox("inbox")
        })
    })
    document.querySelector('#email-view').append(unarchiveButton)
  }
  document.querySelector('#email-view').append(bodySection)
}

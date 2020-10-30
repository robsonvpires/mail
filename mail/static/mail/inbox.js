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
            .then(() => {  
                load_mailbox('sent');
            })

        return false;
    }

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email( event, recipients = '', subject = '', body = '') {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = recipients;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach(email => {
                const single_email = document.createElement("div");
                single_email.innerHTML = `
                    <div class="single-email">
                        <div>${email.sender}</div>
                        <div>${email.subject}</div> 
                        <div>${email.timestamp}</div>
                    </div>`

                single_email.addEventListener('click', function() {

                    fetch(`/emails/${email.id}`)
                        .then(response => response.json())
                        .then(email => {
                            if (!email.read) {
                                fetch(`/emails/${email.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({read: true})
                                })
                            }
                            load_email(mailbox, email)
                        });
                })

                single_email.style.backgroundColor = "white";
                if (email.read) {
                    single_email.style.backgroundColor = "lightgray";
                }
                document.querySelector("#emails-view").append(single_email)
            })
        });
}

function load_email(email_origin, email_content) {
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    const email_info = document.createElement("div");
    email_info.innerHTML = `
        <div class="container">
            <div>${email_content.timestamp}</div>
            <div>From: ${email_content.sender}</div>
            <div>To: ${email_content.recipients.join()}</div>
            <div>Subject: ${email_content.subject}</div>
        </div>
    `
    const email_sender = document.createElement("div");
    email_sender.innerHTML = `<div>From: ${email_content.sender}</div>`;

    const email_receiver = document.createElement("div");
    email_receiver.innerHTML = `<div>To: ${email_content.recipients.join()}</div>`;

    const email_subject = document.createElement("div");
    email_subject.innerHTML = `<div>Subject: ${email_content.subject}</div>`;

    const body_content = document.createElement("div");
    body_content.innerHTML = `<div class="container">${email_content.body}</div>`;

    const email_time = document.createElement("div");
    email_time.innerHTML = `<div>Date: ${email_content.timestamp}</div>`;

    const button_reply = document.createElement("button");
    button_reply.innerHTML = "Reply";
    button_reply.className = "btn btn-sm btn-outline-primary";
    
    button_reply.addEventListener('click', function(event) {
        let subject = email_content.subject
        if (!email_content.subject.substring(0,4) !== 'Re: ') {
            subject = `Re: ${subject}`
        }
        let body = `On ${email_content.timestamp}, \n ${email_content.sender} sent: \n ${email_content.body} \n ---------------------------- \n `
        let recipient = email_content.sender;
        compose_email(event, recipient, subject, body)
    });

    document.querySelector('#email-view').innerHTML = "";
    document.querySelector('#email-view').append(email_info)
    document.querySelector('#email-view').append(body_content)
    document.querySelector('#email-view').append(button_reply)

    if (email_origin === "inbox") {
        const button_archive = document.createElement("button");
        button_archive.innerHTML = "Archive"
        button_archive.className = "btn btn-sm btn-outline-primary"
        button_archive.addEventListener('click', function() {
            fetch(`/emails/${email_content.id}`, {
                method: 'PUT',
                body: JSON.stringify({archived: true})
            })
                .then(() => {
                    load_mailbox("inbox")
                })
        })
        document.querySelector('#email-view').append(button_archive)
    } 
    else if (email_origin === "archive") {
        const button_unarchive = document.createElement("button");
        button_unarchive.innerHTML = "Unarchive"
        button_unarchive.className = "btn btn-sm btn-outline-primary"
        button_unarchive.addEventListener('click', function() {
            fetch(`/emails/${email_content.id}`, {
                method: 'PUT',
                body: JSON.stringify({archived: false})
            })
                .then(() => {
                    load_mailbox("inbox")
                })
        })
        document.querySelector('#email-view').append(button_unarchive)
    }
}
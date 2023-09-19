const dns = require("dns");
const net = require("net");

async function verifyEmail(email) {
  try {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) {
      throw new Error("Invalid email address.");
    }

    // Extract the domain from the email address
    const domain = email.split("@")[1];
    console.log(`Domain: ${domain}`);

    // Resolve MX records for the domain
    const mxRecords = await dns.promises.resolveMx(domain);
    console.log("MX Records:", mxRecords);

    // Sort the MX records by priority
    const sortedRecords = mxRecords.sort((a, b) => a.priority - b.priority);
    console.log("Sorted MX Records:", sortedRecords);

    // Try to establish a socket connection with the mail server
    const socket = new net.Socket();
    await new Promise((resolve, reject) => {
      socket.connect(25, sortedRecords[0].exchange, () => {
        console.log("Socket connection established.");
        resolve();
      });
      socket.on("error", (err) => {
        reject(err);
      });
    });

    // Send SMTP commands and listen for responses
    const response = await sendSMTPCommands(socket, email);
    console.log("SMTP Response:", response);

    // Close the socket connection
    socket.end();
    console.log("Socket connection closed.");

    // Check the response to determine if email is valid
    if (response.toString().startsWith("250")) {
      console.log(`Email address '${email}' is valid.`);
      return true;
    } else {
      console.log(`Email address '${email}' is not valid.`);
      return false;
    }
  } catch (err) {
    console.log(`An error occurred while verifying the email address: ${err}`);
  }
}

// Function to send SMTP commands and receive responses
function sendSMTPCommands(socket, email) {
  return new Promise((resolve, reject) => {
    socket.once("data", (data) => {
      console.log("Received data:", data.toString());
      if (data.toString().startsWith("220")) {
        socket.write(`HELO example.com\r\n`, "utf8");
        console.log("Sent HELO command.");
        socket.once("data", (data) => {
          console.log("Received data:", data.toString());
          if (data.toString().startsWith("250")) {
            socket.write(`MAIL FROM:<imi.ashiq@gmail.com>\r\n`, "utf8");
            console.log("Sent MAIL FROM command.");
            socket.once("data", (data) => {
              console.log("Received data:", data.toString());
              if (data.toString().startsWith("250")) {
                socket.write(`RCPT TO:<${email}>\r\n`, "utf8");
                console.log(`Sent RCPT TO command for ${email}.`);
                socket.once("data", (data) => {
                  console.log("Received data:", data.toString());
                  if (data.toString().startsWith("250")) {
                    resolve(data.toString());
                  } else {
                    reject(new Error("Invalid response after RCPT command."));
                  }

                  //   Data need to be added here
                });
              } else {
                reject(new Error("Invalid response after MAIL command."));
              }
            });
          } else {
            reject(new Error("Invalid response after HELO command."));
          }
        });
      } else {
        reject(new Error("Invalid response after connecting to the server."));
      }
    });
  });
}

module.exports = {
  verifyEmail,
};

// smtp.js
const createOutput = require("../output/output");
const { ErrorCodes, hasCode } = require("./errorCodes");
const net = require("net");

let myLogArray = [];

const log = (...args) => {
  console.log("Here is my log", ...args);

  myLogArray.push(...args);

  return myLogArray;
};

const clearLogs = () => {
  myLogArray = [];
};

const checkSMTP = async (sender, recipient, exchange) => {
  const timeout = 1000 * 100;
  return new Promise((r) => {
    let receivedData = false;
    let closed = false;
    const socket = net.createConnection(25, exchange);
    socket.setEncoding("ascii");

    socket.setTimeout(timeout);

    socket.on("error", (error) => {
      log("Socket Fail", error);
      socket.emit("Fail", error);
      console.log("Socket Fail Error", error);
    });

    socket.on("close", (hadError) => {
      if (!receivedData && !hadError) {
        socket.emit(
          "fail",
          `Mail server closed connection without sending any data.`
        );
      }
      if (!closed) {
        socket.emit("fail", `Mail server closed connection unexpectedly.`);
      }
    });

    socket.once("fail", (msg, errorCode) => {
      closed = true;
      console.log("Fail Event Error", msg);
      // log("Socket Fail Connection Error",msg)
      r(createOutput("smtp", msg, errorCode));
      if (socket.writable && !socket.destroyed) {
        socket.write(`quit\r\n`);
        socket.end();
        socket.destroy();
      }
    });

    socket.on("success", () => {
      closed = true;
      if (socket.writable && !socket.destroyed) {
        socket.write(`quit\r\n`);
        socket.end();
        socket.destroy();
      }
      r(createOutput());
    });

    const commands = [
      `helo ${exchange}\r\n`,
      `mail from: <${sender}>\r\n`,
      `rcpt to: <${recipient}>\r\n`,
    ];
    let i = 0;
    socket.on("next", () => {
      if (i < 3) {
        if (socket.writable) {
          socket.write(commands[i++]);
        } else {
          socket.emit("fail", "SMTP communication unexpectedly closed.");
        }
      } else {
        socket.emit("success");
      }
    });

    socket.on("timeout", () => {
      console.log("Timeout Fail");
      socket.emit("fail", "Timeout");
    });

    socket.on("connect", () => {
      socket.on("data", (msg) => {
        receivedData = true;
        log("data", msg);
        if (hasCode(msg, 220) || hasCode(msg, 250)) {
          socket.emit("next", msg);
        } else if (hasCode(msg, 550)) {
          console.log("Mail Box Error", msg);
          socket.emit("fail", "Mailbox not found.", 550);
        } else {
          const code = Object.keys(ErrorCodes).find((x) => hasCode(msg, x));
          console.log("code", code);
          console.log("Other Code Error", msg);
          socket.emit(
            "fail",
            ErrorCodes[code] || "Unrecognized SMTP response.",
            code
          );
        }
      });
    });
  });
};

module.exports = { checkSMTP, log, clearLogs };

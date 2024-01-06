import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

function updateUserStats(userId, ticketId, state) {
  // asynchronous function;
  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  const userUpdateParam = {
    TableName: "ticket-monitering-table",
    Key: {
      sk: `USER#${userId}`,
      pk: `USR#DETAILS`,
    },
    UpdateExpression:
      "SET #activeTicket = :activeTicket,#activeTicketId = :activeTicketId",
    ExpressionAttributeNames: {
      "#activeTicket": "activeTicket",
      "#activeTicketId": "activeTicketId",
    },
    ExpressionAttributeValues: {
      ":activeTicket": state,
      ":activeTicketId": ticketId,
    },
  };
  return ddbDocClient.send(new UpdateCommand(userUpdateParam));
}

function getTicket(userId, ticketId) {
  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

  const params = {
    TableName: "ticket-monitering-table",
    Key: {
      pk: `USER#${userId}`,
      sk: `TCKT#${ticketId}`,
    },
  };

  return ddbDocClient.send(new GetCommand(params));
}

export const handler = async (event, context, callback) => {
  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

  const params = {
    TableName: "ticket-monitering-table",
    Key: {
      sk: `USER#${event.userId}`,
      pk: `USR#DETAILS`,
    },
  };

  const user = await ddbDocClient.send(new GetCommand(params));
  const { activeTicket } = user.Item;

  if (event.type === "start" && !activeTicket) {
    try {
      const response = await getTicket(event.userId, event.ticketId);

      let ticket = response.Item;
      if (!ticket)
        return {
          status: false,
          message:
            "Something went wrong with fetching ticket please try after sometime",
        };
      if (ticket.currentAction === "none") {
        const time = Date.now();
        const updateParamsarams = {
          TableName: "ticket-monitering-table",
          Key: {
            sk: `TCKT#${event.ticketId}`,
            pk: `USER#${event.userId}`,
          },
          UpdateExpression:
            "SET #startTime = :startTime,#expectedStop = :expectedStop,#status = :status,#isPaused = :isPaused,#currentAction = :currentAction,#initialStartedTime = :initialStartedTime,#totalTime = :totalTime",
          ExpressionAttributeNames: {
            "#startTime": "startTime",
            "#expectedStop": "expectedStop",
            "#status": "status",
            "#isPaused": "isPaused",
            "#currentAction": "currentAction",
            "#initialStartedTime": "initialStartedTime",
            "#totalTime": "totalTime",
          },
          ExpressionAttributeValues: {
            ":startTime": time,
            ":expectedStop": time + 28_800_000,
            ":status": "open",
            ":isPaused": "false",
            ":currentAction": "started",
            ":initialStartedTime": time,
            ":totalTime": 0,
          },
        };

        await Promise.all([
          ddbDocClient.send(new UpdateCommand(updateParamsarams)),
          updateUserStats(event.userId, event.ticketId, true),
        ]);

        return {
          status: true,
          message: "success",
        };
      } else {
        return {
          status: false,
          message:
            "Ticket is already started or you can currently another active ticket",
        };
      }
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "fail",
      };
    }
  } else if (event.type === "pause") {
    try {
      const response = await getTicket(event.userId, event.ticketId);
      let ticket = response.Item;
      let totalTime = 0;
      let { effort, totalTimeSpent } = ticket;
      if (ticket.currentAction === "started") {
        const time = Date.now();
        let startTime = ticket.startTime;
        let duration = time - startTime;

        if (effort.length === 0) totalTime += duration;
        else {
          //  calculating past duration
          for (let i = 0; i < effort.length; i++) {
            totalTime += effort[i].duration;
          }
          // calculating current
          totalTime += duration;
        }

        const updateParams = {
          TableName: "ticket-monitering-table",
          Key: {
            sk: `TCKT#${event.ticketId}`,
            pk: `USER#${event.userId}`,
          },
          UpdateExpression:
            "SET #isPaused = :isPaused,#endTime = :endTime,#effort = :effort,#currentAction = :currentAction,#totalTime = :totalTime,#totalTimeSpent = :totalTimeSpent",
          ExpressionAttributeNames: {
            "#endTime": "endTime",
            "#isPaused": "isPaused",
            "#effort": "effort",
            "#currentAction": "currentAction",
            "#totalTime": "totalTime",
            "#totalTimeSpent": "totalTimeSpent",
          },
          ExpressionAttributeValues: {
            ":endTime": time,
            ":isPaused": "true",
            ":currentAction": "paused",
            ":totalTime": totalTime,
            ":totalTimeSpent": totalTimeSpent + duration,
            ":effort": [
              ...ticket.effort,
              {
                startTime,
                endTime: time,
                duration,
              },
            ],
          },
        };

        await Promise.all([
          updateUserStats(event.userId, null, false),
          ddbDocClient.send(new UpdateCommand(updateParams)),
        ]);
        return {
          status: true,
          message: "success",
          totalTime,
        };
      } else {
        return {
          status: false,
          message: "Ticket is already paused",
        };
      }
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "fail",
      };
    }
  } else if (event.type === "resume" && !activeTicket) {
    try {
      const response = await getTicket(event.userId, event.ticketId);
      let ticket = response.Item;

      if (ticket.currentAction === "paused") {
        const time = Date.now();

        const updateParams = {
          TableName: "ticket-monitering-table",
          Key: {
            sk: `TCKT#${event.ticketId}`,
            pk: `USER#${event.userId}`,
          },
          UpdateExpression:
            "SET #isPaused = :isPaused,#startTime = :startTime,#currentAction = :currentAction",
          ExpressionAttributeNames: {
            "#startTime": "startTime",
            "#isPaused": "isPaused",
            "#currentAction": "currentAction",
          },
          ExpressionAttributeValues: {
            ":startTime": time,
            ":isPaused": "false",
            ":currentAction": "started",
          },
        };
        await Promise.all([
          ddbDocClient.send(new UpdateCommand(updateParams)),
          updateUserStats(event.userId, event.ticketId, true),
        ]);
        return {
          status: true,
          message: "success",
        };
      } else {
        return {
          status: false,
          message: "Ticket is not paused or you have another open ticket",
        };
      }
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "fail",
      };
    }
  } else if (event.type === "stop") {
    try {
      const response = await getTicket(event.userId, event.ticketId);

      let currentTime = Date.now();
      let ticket = response.Item;

      let { totalTimeSpent } = ticket;

      if (ticket.currentAction === "started") {
        let { totalTime = 0 } = ticket;
        let noOfAttempts = 0;

        if (ticket.noOfAttempts > 0) {
          noOfAttempts = ticket.noOfAttempts + 1;
        } else {
          noOfAttempts = 1;
        }

        let ticketResumedTime = ticket.startTime;
        let duration = currentTime - ticketResumedTime;
        ticket.effort.push({
          startTime: ticketResumedTime,
          endTime: currentTime,
          duration,
        });
        let totalEffort = ticket.effort;
        if (totalEffort.length > 0) {
          // for (let i = 0; i < totalEffort.length; i++) {
          //   totalTime += totalEffort[i].duration;
          // }
          totalTime += duration;
        } else {
          totalTime = currentTime - ticket.startTime;
        }
        // let totalTimeSpent = totalTime;
        // let timeHistory = ticket.timeHistory;
        let initialStartedTime = ticket.initialStartedTime;
        // if (noOfAttempts > 1) {
        //   for (let i = 0; i < timeHistory.length; i++) {
        //     totalTimeSpent += timeHistory[i]?.totalTime;
        //   }
        // }

        totalTimeSpent += duration;

        const updateParams = {
          TableName: "ticket-monitering-table",
          Key: {
            sk: `TCKT#${event.ticketId}`,
            pk: `USER#${event.userId}`,
          },
          UpdateExpression:
            "SET #noOfAttempts = :noOfAttempts,#totalTime = :totalTime,#status = :status,#timeHistory = :timeHistory,#effort = :effort,#history = :history,#currentAction = :currentAction,#totalTimeSpent = :totalTimeSpent",
          ExpressionAttributeNames: {
            "#totalTime": "totalTime",
            "#noOfAttempts": "noOfAttempts",
            "#status": "status",
            "#timeHistory": "timeHistory",
            "#effort": "effort",
            "#history": "history",
            "#currentAction": "currentAction",
            "#totalTimeSpent": "totalTimeSpent",
          },
          ExpressionAttributeValues: {
            ":totalTime": totalTime,
            ":noOfAttempts": noOfAttempts,
            ":totalTimeSpent": totalTimeSpent,
            ":status": "closed",
            ":currentAction": "none",
            ":timeHistory": [
              ...ticket.timeHistory,
              { attempt: noOfAttempts, totalTime },
            ],
            ":history": [...ticket.history, [...ticket.effort]],
            ":effort": [],
          },
        };

        await Promise.all([
          updateUserStats(event.userId, null, false),
          ddbDocClient.send(new UpdateCommand(updateParams)),
        ]);
        return {
          status: true,
          message: "success",
          totalTime,
          noOfAttempts,
          totalTimeSpent,
          initialStartedTime,
        };
      } else {
        return {
          status: false,
          message: "Ticket have not started yet or ticket is in paused state",
        };
      }
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "fail",
      };
    }
  } else {
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

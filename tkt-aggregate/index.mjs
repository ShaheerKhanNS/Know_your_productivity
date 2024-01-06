import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

function updateUserStats(
  userId,
  openTickets,
  closeTickets,
  idleTickets,
  totalHours,
  totalTickets
) {
  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

  const updateParams = {
    TableName: "ticket-monitering-table",
    Key: {
      pk: `USR#DETAILS`,
      sk: userId,
    },
    UpdateExpression:
      "SET #totalTickets = :totalTickets,#idleTickets = :idleTickets,#openTickets = :openTickets,#closeTickets = :closeTickets,#totalHours = :totalHours",
    ExpressionAttributeNames: {
      "#totalTickets": "totalTickets",
      "#idleTickets": "idleTickets",
      "#openTickets": "openTickets",
      "#closeTickets": "closeTickets",
      "#totalHours": "totalHours",
    },
    ExpressionAttributeValues: {
      ":totalTickets": totalTickets,
      ":idleTickets": idleTickets,
      ":totalHours": totalHours,
      ":closeTickets": closeTickets,
      ":openTickets": openTickets,
    },
  };
  return ddbDocClient.send(new UpdateCommand(updateParams));
}

export const handler = async (event) => {
  const {
    eventName,
    dynamodb: {
      NewImage = {},
      OldImage = {},
      Keys: {
        pk: { S: pk = {} },
      },
    },
  } = event.Records[0];
  console.log(
    `length of event records ===> ${
      event.Records.length
    } and event is ${JSON.stringify(event)}`
  );

  if (pk === "USR#DETAILS") return;

  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  const getParams = {
    TableName: "ticket-monitering-table",
    Key: {
      pk: `USR#DETAILS`,
      sk: pk,
    },
  };

  const response = await ddbDocClient.send(new GetCommand(getParams));

  const userDetails = response.Item;

  if (!userDetails) return;

  let totalTickets = Number(userDetails.totalTickets) || 0;
  let idleTickets = Number(userDetails.idleTickets) || 0;
  let openTickets = Number(userDetails.openTickets) || 0;
  let closeTickets = Number(userDetails.closeTickets) || 0;
  let totalHours = Number(userDetails.totalHours) || 0;

  if (eventName === "INSERT") {
    totalTickets += 1;
    idleTickets += 1;
    if (event.Records.length > 1) {
      let count = 0;

      for (let i = 0; i < event.Records.length; i++) {
        if (event.Records[i].eventName === "INSERT") {
          count++;
        }
      }

      totalTickets += count - 1;
      idleTickets += count - 1;
    }
    await updateUserStats(
      pk,
      openTickets,
      closeTickets,
      idleTickets,
      totalHours,
      totalTickets
    );
    return;
  } else if (eventName === "REMOVE") {
    totalTickets -= 1;
    idleTickets -= 1;
    await updateUserStats(
      pk,
      openTickets,
      closeTickets,
      idleTickets,
      totalHours,
      totalTickets
    );
    return;
  } else if (eventName === "MODIFY") {
    switch (NewImage.status.S) {
      case "open":
        if (OldImage.status.S === "idle") {
          idleTickets -= 1;
          openTickets += 1;
        }

        totalHours += NewImage.totalTimeSpent.N - OldImage?.totalTimeSpent.N;

        if (OldImage.status.S === "closed") {
          closeTickets -= 1;
          openTickets += 1;
        }
        await updateUserStats(
          pk,
          openTickets,
          closeTickets,
          idleTickets,
          totalHours,
          totalTickets
        );

        break;
      case "closed":
        totalHours += NewImage.totalTimeSpent.N - OldImage?.totalTimeSpent.N;

        openTickets -= 1;
        closeTickets += 1;
        if (OldImage.status.S === "idle") {
          idleTickets -= 1;
        }

        await updateUserStats(
          pk,
          openTickets,
          closeTickets,
          idleTickets,
          totalHours,
          totalTickets
        );
        break;
    }
  }
};

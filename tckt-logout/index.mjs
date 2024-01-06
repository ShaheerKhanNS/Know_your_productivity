import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  CognitoIdentityProviderClient,
  RevokeTokenCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event) => {
  const time = Date.now();
  const { refreshToken } = event;
  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  try {
    const client = new CognitoIdentityProviderClient();
    const input = {
      Token: refreshToken, // required
      ClientId: "4ba0e741d1tdevorj8mq37cqls", // required
    };

    const params = {
      TableName: "ticket-monitering-table",
      Key: {
        pk: `USR#DETAILS`,
        sk: `USER#${event.userId}`,
      },
      UpdateExpression: "SET #loggedOut = :loggedOut",
      ExpressionAttributeNames: {
        "#loggedOut": "loggedOut",
      },
      ExpressionAttributeValues: {
        ":loggedOut": time,
      },
    };
    const command = new RevokeTokenCommand(input);
    await Promise.all([
      ddbDocClient.send(new UpdateCommand(params)),
      client.send(command),
    ]);

    return {
      status: true,
      message: "success",
    };
  } catch (err) {
    console.log(JSON.stringify(err));
    return {
      status: false,
      message: "fail",
    };
  }
};

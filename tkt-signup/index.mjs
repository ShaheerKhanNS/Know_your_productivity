import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  const { name, email, password, employeeId } = event;

  try {
    const client = new CognitoIdentityProviderClient();
    const input = {
      ClientId: "4ba0e741d1tdevorj8mq37cqls",

      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "custom:employeeId",
          Value: employeeId.toString(),
        },
        {
          Name: "name",
          Value: name,
        },
        {
          Name: "custom:profilePic",
          Value: "https://know-your-productivity.s3.amazonaws.com/profile.jpg",
        },
      ],
    };
    const command = new SignUpCommand(input);
    const response = await client.send(command);
    // console.log(response);

    const time = Date.now();

    const item = {
      pk: `USR#DETAILS`,
      sk: `USER#${response.UserSub}`,
      accountCreated: time,
      loggedIn: null,
      loggedOut: null,
      totalTickets: 0,
      openTickets: 0,
      totalHours: 0,
      closeTickets: 0,
      idleTickets: 0,
      activeTicket: false,
      activeTicketId: null,
    };

    const ddbClient = new DynamoDBClient();
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
    const Tableparams = {
      TableName: "ticket-monitering-table",

      Item: item,
    };
    await ddbDocClient.send(new PutCommand(Tableparams));

    return {
      status: true,
      message: "success",
    };
  } catch (err) {
    console.log(err);
    return {
      status: false,
      message: `${
        err.__type === "UsernameExistsException"
          ? "Email already exist,Please use login"
          : err.__type === "InvalidPasswordException"
          ? "Please use a strong password of min 8 characters"
          : "Something went wrong"
      }`,
    };
  }
};

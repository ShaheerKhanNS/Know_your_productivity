import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event) => {
  const client = new CognitoIdentityProviderClient();
  const input = {
    UserPoolId: "us-east-1_K1JJkkGg6",
  };
  const command = new ListUsersCommand(input);
  const { Users } = await client.send(command);

  for (let i = 0; i < Users.length; i++) {
    if (Users[i].UserStatus === "UNCONFIRMED") {
      const userCreationDate = new Date(Users[i].UserCreateDate);
      const currentDate = new Date();
      const timeDifference = currentDate - userCreationDate;

      const twentyFourHoursInMilliseconds = 168 * 60 * 60 * 1000;

      if (timeDifference > twentyFourHoursInMilliseconds) {
        const input = {
          UserPoolId: "us-east-1_K1JJkkGg6",
          Username: Users[i].Username,
        };
        const command = new AdminDeleteUserCommand(input);
        await client.send(command);
      }
    }
  }
};

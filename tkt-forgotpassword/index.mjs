import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event) => {
  const { email } = event;
  try {
    const client = new CognitoIdentityProviderClient();

    const input = {
      ClientId: "4ba0e741d1tdevorj8mq37cqls",
      Username: email,
    };
    const command = new ForgotPasswordCommand(input);
    await client.send(command);
    return {
      status: true,
      message: "OTP has been send to your registered email.",
    };
  } catch (err) {
    return {
      status: false,
      message: "Please enter correct email🤗",
    };
  }
};

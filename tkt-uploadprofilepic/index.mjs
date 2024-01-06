import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  CognitoIdentityProviderClient,
  UpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
export const handler = async (event) => {
  const { userId, image, AccessToken } = event;
  const client = new S3Client();
  const cognitoClient = new CognitoIdentityProviderClient();

  try {
    const buf = Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const Key = `profile-image/${userId}`;
    const Bucket = "know-your-productivity";

    const input = {
      Body: buf,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
      Bucket,
      Key,
    };

    const command = new PutObjectCommand(input);
    await client.send(command);

    const getObjectInput = {
      Key,
      Bucket,
    };

    const getCommand = new GetObjectCommand(getObjectInput);
    const response = await client.send(getCommand);

    const url = `https://` + response.Body.req.host + response.Body.req.path;
    const cognitoInput = {
      UserAttributes: [
        {
          Name: "custom:profilePic",
          Value: url,
        },
      ],
      AccessToken,
    };
    const cognitoCommand = new UpdateUserAttributesCommand(cognitoInput);
    await cognitoClient.send(cognitoCommand);
    return {
      status: true,
      url,
    };
  } catch (err) {
    console.log(err);
    return {
      status: false,
      message: "fail",
    };
  }
};

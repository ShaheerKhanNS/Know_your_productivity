import readXlsxFile from "read-excel-file/node";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

export const handler = async (event) => {
  const { userId, excel } = event;
  if (
    !excel.includes(
      "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,"
    )
  )
    return {
      status: false,
      message:
        "Please upload correct XLSX file or excel sheet with EmployeeId,Sprint,Title,Category,Description",
    };
  try {
    const buf = Buffer.from(
      excel.replace(
        "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,",
        ""
      ),
      "base64"
    );

    const schema = {
      EmployeeId: {
        prop: "employeeId",
        required: true,
      },
      Sprint: {
        prop: "sprint",
        required: true,
      },
      Title: {
        prop: "title",
        required: true,
      },
      Category: {
        prop: "category",
        required: true,
      },
      Description: {
        prop: "description",
        required: true,
      },
    };

    const { rows, errors } = await readXlsxFile(buf, { schema });
    if (errors.length > 0)
      throw new Error(
        "Please include EmployeeId,Sprint,Title,Category,Description in this format"
      );
    const client = new LambdaClient();
    for (let i = 0; i < rows.length; i++) {
      const blob = await new Blob([JSON.stringify({ ...rows[i], userId })], {
        type: "application/json",
      }).text();
      const input = {
        FunctionName: "tkt-store-data",
        InvocationType: "Event",
        Payload: blob,
      };
      const command = new InvokeCommand(input);
      await client.send(command);
    }
    return {
      status: true,
      message: "success",
    };
  } catch (err) {
    console.log(err);
    return {
      status: false,
      message: err.message || "fail",
    };
  }
};

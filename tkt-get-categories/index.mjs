export const handler = async (event) => {
  const categories = [
    {
      name: "Feature",
      iconUrl: "https://know-your-productivity.s3.amazonaws.com/features.png",
    },
    {
      name: "Task",
      iconUrl: "https://know-your-productivity.s3.amazonaws.com/task.png",
    },
    {
      name: "Bug",
      iconUrl: "https://know-your-productivity.s3.amazonaws.com/bug.png",
    },
  ];

  return {
    status: true,
    message: "success",
    categories,
  };
};

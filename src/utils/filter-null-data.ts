export const filterNull = (data: Array<Array<string>>) => {
  const filteredData = data.filter((row) =>
    row.some((value) => value !== null),
  );

  return filteredData;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok) {
    const error = new Error(
      json.error?.message || 'An error occurred while fetching the data'
    ) as any;
    error.status = response.status;
    error.message = json.error?.message || 'An error occurred while fetching the data';
    throw error;
  }

  return json;
};

export default fetcher;

export interface TestData {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
  image?: string;
}

export const testApi = {
  getTestList: async (): Promise<TestData[]> => {
    const response = await fetch(`https://jsonplaceholder.typicode.com/photos`);
    if (!response.ok) {
      throw new Error("Failed to fetch test data");
    }
    const data = await response.json();
    return data.slice(0, 100);
  },
};

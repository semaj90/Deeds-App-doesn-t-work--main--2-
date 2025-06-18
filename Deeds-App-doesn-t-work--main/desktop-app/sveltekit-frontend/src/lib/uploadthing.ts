export type FileRouter = {
  imageUploader: {
    metadata: {};
    input: {};
    output: {
      key: string;
      url: string;
      name: string;
    }[];
  };
};
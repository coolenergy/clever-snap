import { PORT } from "@/env-vars";
import answerRouter from "@/routes/answer";
import express from "express";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use("/answer", answerRouter);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

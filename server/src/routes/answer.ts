import { OPENAI_API_KEY } from "@/env-vars";
import { Router } from "express";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const answerRouter = Router();

answerRouter.post("/generate", async (req, res) => {
  const { imgUri }: { imgUri: string } = req.body;
  if (!imgUri) {
    return res.status(400).send("imgUri is required");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content:
            'You will receive an image of a question(s) and you will answer it/them without explanation. If there are multiple questions list them. The user might ask for an explanation after. If the image does not contain an answerable content, you should respond with "This snap does not contain an answerable content. Please try again."',
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imgUri },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });
    const answer = response.choices[0].message.content;
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error while generating answer.");
  }
});

export default answerRouter;

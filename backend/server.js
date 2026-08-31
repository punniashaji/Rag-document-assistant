import "dotenv/config";

import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import * as lancedb from "@lancedb/lancedb";

import { ingestDocument, embed } from "./ingest.js";


// ====================================
// PATH SETUP
// ====================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDirectory =
    path.resolve(__dirname, "../frontend");

const uploadDirectory =
    path.resolve(__dirname, "../uploads");


// ====================================
// EXPRESS
// ====================================

const app = express();

const PORT =
    process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.use(
    express.static(frontendDirectory)
);


// ====================================
// LANCEDB
// ====================================

const db =
    await lancedb.connect("./embeddings");


// ====================================
// GEMINI
// ====================================

const ai =
    new GoogleGenAI({});


// ====================================
// MULTER
// ====================================

const upload = multer({

    dest: uploadDirectory,

    limits: {
        fileSize: 25 * 1024 * 1024
    },

    fileFilter: (_req, file, callback) => {

        const isPdf =
            file.mimetype === "application/pdf" ||
            file.originalname
                .toLowerCase()
                .endsWith(".pdf");


        if (!isPdf) {

            return callback(
                new Error(
                    "Only PDF files are allowed."
                )
            );

        }

        callback(null, true);

    }

});


// ====================================
// HOME PAGE
// ====================================

app.get("/", (_req, res) => {

    res.sendFile(
        path.join(
            frontendDirectory,
            "index.html"
        )
    );

});


// ====================================
// UPLOAD PDF
// ====================================

app.post(
    "/api/upload",
    upload.single("pdf"),

    async (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                error:
                    "Please upload a PDF file."

            });

        }


        try {

            console.log("\n====================================");
            console.log("PDF received:", req.file.originalname);
            console.log("Starting PDF processing...");


            const result =
                await ingestDocument(
                    req.file.path,
                    "rag"
                );


            console.log("PDF processing completed.");
            console.log("Documents:", result.documents);
            console.log("Chunks:", result.chunks);
            console.log("====================================\n");


            return res.status(200).json({

                success: true,

                message:
                    "PDF uploaded and processed successfully.",

                filename:
                    req.file.originalname,

                documents:
                    result.documents,

                chunks:
                    result.chunks

            });


        } catch (error) {

            console.error(
                "Upload error:",
                error.message
            );


            return res.status(500).json({

                success: false,

                error:
                    error.message ||
                    "PDF upload failed."

            });


        } finally {

            const fs =
                await import("fs/promises");


            await fs.unlink(
                req.file.path
            ).catch(() => {});

        }

    }
);


// ====================================
// ASK QUESTION
// ====================================

app.post(
    "/api/ask",

    async (req, res) => {

        try {

            const {
                question
            } = req.body;


            // ====================================
            // CHECK QUESTION
            // ====================================

            if (
                !question ||
                typeof question !== "string" ||
                !question.trim()
            ) {

                return res.status(400).json({

                    error:
                        "Question is required."

                });

            }


            const cleanQuestion =
                question.trim();


            console.log("\n====================================");
            console.log("Question:", cleanQuestion);


            // ====================================
            // OPEN LANCEDB TABLE
            // ====================================

            const table =
                await db.openTable("rag");


            // ====================================
            // EMBED QUESTION
            // ====================================

            const queryVector =
                await embed(
                    cleanQuestion
                );


            console.log("Query embedding generated.");


            // ====================================
            // SEARCH LANCEDB
            // ====================================

            const results =
                await table
                    .search(queryVector)
                    .limit(8)
                    .toArray();


            if (!results.length) {

                console.log(
                    "No relevant information found."
                );

                return res.status(404).json({

                    error:
                        "No relevant information was found in the document."

                });

            }


            console.log(
                `Retrieved ${results.length} relevant chunks.`
            );


            // ====================================
            // CREATE CONTEXT
            // ====================================

            const context =
                results
                    .map(item => item.text)
                    .filter(text =>
                        text &&
                        text.trim()
                    )
                    .join("\n\n");


            if (!context.trim()) {

                console.log(
                    "Retrieved chunks contained no usable text."
                );

                return res.status(404).json({

                    error:
                        "No usable information was found in the document."

                });

            }


            console.log(
                "Relevant document context prepared."
            );


            // ====================================
            // GEMINI
            // ====================================

            console.log(
                "Sending context to Gemini..."
            );


            const response =
                await ai.models.generateContent({

                    model:
                        "gemini-3.6-flash",

                    config: {

                        systemInstruction:
                            `You are a document question-answering assistant.

Answer the user's question using only the supplied document context.

Do not use outside knowledge.

Give a clear, natural and concise answer.

Do not simply copy large portions of the document.

If the answer is not available in the supplied context, say:

"The information is not available in the document."`

                    },

                    contents:
                        `Document Context:

${context}

User Question:

${cleanQuestion}

Answer:`

                });


            // ====================================
            // GET ANSWER
            // ====================================

            const answer =
                response.text;


            if (!answer) {

                console.log(
                    "Gemini returned an empty answer."
                );

                return res.status(500).json({

                    error:
                        "Gemini returned an empty answer."

                });

            }


            console.log(
                "Answer generated successfully."
            );

            console.log("====================================\n");


            // ====================================
            // SEND ANSWER
            // ====================================

            return res.status(200).json({

                success: true,

                answer:
                    answer

            });


        } catch (error) {

            console.error(
                "Question error:",
                error.message
            );


            return res.status(500).json({

                success: false,

                error:
                    error.message ||
                    "Failed to answer the question."

            });

        }

    }
);


// ====================================
// ERROR HANDLER
// ====================================

app.use(
    (error, _req, res, _next) => {

        console.error(
            "Server error:",
            error.message
        );


        return res.status(400).json({

            success: false,

            error:
                error.message ||
                "Request failed."

        });

    }
);


// ====================================
// START SERVER
// ====================================

app.listen(
    PORT,

    () => {

        console.log(
            "===================================="
        );

        console.log(
            `RAG backend running on http://localhost:${PORT}`
        );

        console.log(
            "===================================="
        );

    }
);
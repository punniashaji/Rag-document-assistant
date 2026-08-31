import "dotenv/config";

import fs from "fs/promises";
import path from "path";

import { pipeline } from "@huggingface/transformers";

import * as lancedb from "@lancedb/lancedb";

import {
    RecursiveCharacterTextSplitter
} from "@langchain/textsplitters";

import { PDFParse } from "pdf-parse";


// ====================================
// LANCEDB
// ====================================

const db =
    await lancedb.connect("./embeddings");


// ====================================
// EMBEDDING MODEL
// ====================================

console.log(
    "Loading embedding model..."
);

const model =
    await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
    );

console.log(
    "Embedding model loaded."
);


// ====================================
// EMBEDDING FUNCTION
// ====================================

export async function embed(text) {

    if (
        !text ||
        typeof text !== "string"
    ) {

        throw new Error(
            "Text is required for embedding."
        );

    }

    const output =
        await model(
            text,
            {
                pooling: "mean",
                normalize: true
            }
        );

    return Array.from(
        output.data
    );
}


// ====================================
// INGEST DOCUMENT
// ====================================

export async function ingestDocument(
    filePath,
    tableName = "rag"
) {

    console.log(
        "Starting ingestion..."
    );

    console.log(
        "PDF:",
        filePath
    );


    try {

        // ====================================
        // READ PDF FILE
        // ====================================

        console.log(
            "Reading PDF file..."
        );

        const pdfBuffer =
            await fs.readFile(
                filePath
            );


        // ====================================
        // EXTRACT PDF TEXT
        // ====================================

        console.log(
            "Extracting text from PDF..."
        );

        const parser =
            new PDFParse({
                data: pdfBuffer
            });


        const result =
            await parser.getText();


        const text =
            result.text;


        console.log(
            `PDF pages: ${result.total}`
        );

        console.log(
            `Extracted text length: ${text.length}`
        );


        // ====================================
        // CLEAN PDF TEXT
        // ====================================

        const cleanText =
            text
                .replace(/\r/g, "")
                .replace(/[ \t]+/g, " ")
                .replace(/\n\s*\n\s*\n+/g, "\n\n")
                .trim();


        console.log(
            `Clean text length: ${cleanText.length}`
        );


        // ====================================
        // CHECK TEXT
        // ====================================

        if (
            !cleanText
        ) {

            throw new Error(
                "No readable text could be extracted from this PDF."
            );

        }


        console.log(
            "PDF text extraction successful."
        );


        // ====================================
        // TEXT SPLITTER
        // ====================================

        const textSplitter =
            new RecursiveCharacterTextSplitter({

                chunkSize: 800,

                chunkOverlap: 100

            });


        // ====================================
        // CREATE CHUNKS
        // ====================================

        console.log(
            "Creating text chunks..."
        );


        const chunks =
            await textSplitter.splitText(
                cleanText
            );


        console.log(
            `Created ${chunks.length} chunks`
        );


        // ====================================
        // CREATE EMBEDDINGS
        // ====================================

        const dataList = [];


        for (
            const chunk of chunks
        ) {

            if (
                !chunk ||
                !chunk.trim()
            ) {

                continue;

            }


            const vector =
                await embed(
                    chunk
                );


            dataList.push({

                text:
                    chunk,

                vector:
                    vector

            });

        }


        console.log(
            `Created ${dataList.length} embedded chunks`
        );


        // ====================================
        // CHECK DATA
        // ====================================

        if (
            dataList.length === 0
        ) {

            throw new Error(
                "No text chunks were created from the PDF."
            );

        }


        // ====================================
        // STORE IN LANCEDB
        // ====================================

        await db.createTable(

            tableName,

            dataList,

            {
                mode: "overwrite"
            }

        );


        console.log(
            "Document stored in LanceDB"
        );


        // ====================================
        // RETURN RESULT
        // ====================================

        return {

            documents: 1,

            chunks:
                dataList.length,

            tableName:
                tableName

        };

    }

    catch (error) {

        console.error(
            "Ingestion error:",
            error
        );

        throw error;

    }

}
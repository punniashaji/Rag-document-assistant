import "dotenv/config";

import fs from "fs/promises";
import path from "path";
import os from "os";

import { pipeline } from "@huggingface/transformers";

import * as lancedb
    from "@lancedb/lancedb";

import {
    RecursiveCharacterTextSplitter
} from "@langchain/textsplitters";

import {
    SimpleDirectoryReader
} from "@llamaindex/readers/directory";


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


    // ====================================
    // CREATE TEMP DIRECTORY
    // ====================================

    const tempDirectory =
        await fs.mkdtemp(
            path.join(
                os.tmpdir(),
                "rag-pdf-"
            )
        );


    // ====================================
    // COPY PDF
    // ====================================

    const pdfName =
        path.basename(filePath);


    const tempPdfPath =
        path.join(
            tempDirectory,
            pdfName
        );


    await fs.copyFile(
        filePath,
        tempPdfPath
    );


    console.log(
        "Temporary PDF:",
        tempPdfPath
    );


    try {

        // ====================================
        // READ PDF
        // ====================================

        const reader =
            new SimpleDirectoryReader();


        const documents =
            await reader.loadData(
                tempDirectory
            );


        console.log(
            `Loaded ${documents.length} document(s)`
        );


        // ====================================
        // TEXT SPLITTER
        // ====================================

        const textSplitter =
            new RecursiveCharacterTextSplitter({

                chunkSize: 500,

                chunkOverlap: 50

            });


        // ====================================
        // CREATE DATA
        // ====================================

        const dataList = [];


        for (
            const doc of documents
        ) {

            if (
                !doc.text ||
                !doc.text.trim()
            ) {

                continue;

            }


            const chunks =
                await textSplitter.splitText(
                    doc.text
                );


            console.log(
                `Creating ${chunks.length} chunks...`
            );


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
                    await embed(chunk);


                dataList.push({

                    text:
                        chunk,

                    vector:
                        vector

                });

            }

        }


        console.log(
            `Created ${dataList.length} chunks`
        );


        // ====================================
        // CHECK DATA
        // ====================================

        if (
            dataList.length === 0
        ) {

            throw new Error(
                "No text could be extracted from the PDF."
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
        // RETURN
        // ====================================

        return {

            documents:
                documents.length,

            chunks:
                dataList.length,

            tableName:
                tableName

        };

    }

    finally {

        // ====================================
        // DELETE TEMP DIRECTORY
        // ====================================

        await fs.rm(

            tempDirectory,

            {
                recursive: true,
                force: true
            }

        );

    }

}
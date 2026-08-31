// ====================================

// API

// ====================================



const API_URL = "http://localhost:3000";





// ====================================

// GET HTML ELEMENTS

// ====================================



const pdfFile =

    document.getElementById("pdfFile");



const uploadButton =

    document.getElementById("uploadButton");



const fileLabel =

    document.getElementById("fileLabel");



const documentStatusBox =

    document.getElementById("documentStatusBox");



const documentName =

    document.getElementById("documentName");



const documentStatus =

    document.getElementById("documentStatus");



const statusIcon =

    document.getElementById("statusIcon");



const uploadProgress =

    document.getElementById("uploadProgress");



const uploadProgressBar =

    document.getElementById("uploadProgressBar");



const pdfPreviewContainer =

    document.getElementById("pdfPreviewContainer");



const pdfPreviewPlaceholder =

    document.getElementById("pdfPreviewPlaceholder");



const pdfViewerWrapper =

    document.getElementById("pdfViewerWrapper");



const pdfViewer =

    document.getElementById("pdfViewer");



const previewFileName =

    document.getElementById("previewFileName");



const viewerFileName =

    document.getElementById("viewerFileName");



const openPreviewButton =

    document.getElementById("openPreviewButton");



const closePreviewButton =

    document.getElementById("closePreviewButton");



const questionInput =

    document.getElementById("question");



const askButton =

    document.getElementById("askButton");



const answerCard =

    document.getElementById("answerCard");



const answerText =

    document.getElementById("answer");



const loading =

    document.getElementById("loading");



const errorBox =

    document.getElementById("error");





// ====================================

// VARIABLES

// ====================================



// Store the selected PDF separately.

//

// This is important because after successful

// upload we clear the actual file input.

//

// The PDF is still available in memory for

// previewing before upload.



let selectedPdfFile = null;



let selectedPdfUrl = null;



let uploadedSuccessfully = false;





// ====================================

// CHECK PDF

// ====================================



function isPdf(file) {



    if (!file) {

        return false;

    }



    return (

        file.type === "application/pdf" ||

        file.name

            .toLowerCase()

            .endsWith(".pdf")

    );



}





// ====================================

// SET DOCUMENT STATUS

// ====================================



function setStatus(

    state,

    message,

    name

) {



    documentStatusBox.classList.remove(

        "d-none",

        "selected",

        "uploading",

        "success",

        "failed"

    );



    documentStatusBox.classList.add(

        state

    );



    documentName.textContent =

        name || "document.pdf";



    documentStatus.textContent =

        message;





    const icons = {



        selected:

            "bi-file-earmark-pdf",



        uploading:

            "bi-arrow-repeat",



        success:

            "bi-check-circle-fill",



        failed:

            "bi-x-circle-fill"



    };





    statusIcon.className =

        `bi ${icons[state] || "bi-file-earmark-pdf"}`;





    if (state === "uploading") {



        statusIcon.classList.add(

            "spin"

        );



    } else {



        statusIcon.classList.remove(

            "spin"

        );



    }



}





// ====================================

// PROGRESS

// ====================================



function setProgress(

    value,

    visible

) {



    if (visible) {



        uploadProgress.classList.remove(

            "d-none"

        );



    } else {



        uploadProgress.classList.add(

            "d-none"

        );



    }



    uploadProgressBar.style.width =

        `${value}%`;



}





// ====================================

// CREATE PDF URL

// ====================================



function createPdfUrl(file) {



    if (selectedPdfUrl) {



        URL.revokeObjectURL(

            selectedPdfUrl

        );



    }



    selectedPdfUrl =

        URL.createObjectURL(file);



    return selectedPdfUrl;



}





// ====================================

// SHOW SELECTED PDF

// ====================================



function showSelectedPdf(file) {



    createPdfUrl(file);





    previewFileName.textContent =

        file.name;



    viewerFileName.textContent =

        file.name;





    // Keep PDF viewer closed initially.



    pdfViewer.src = "";



    pdfViewerWrapper.classList.add(

        "d-none"

    );





    // Show preview placeholder.



    pdfPreviewPlaceholder.classList.remove(

        "d-none"

    );





    // Show preview section.



    pdfPreviewContainer.classList.remove(

        "d-none"

    );



}





// ====================================

// HIDE PDF PREVIEW

// ====================================



function hidePdfPreview() {



    pdfViewer.src = "";



    pdfViewerWrapper.classList.add(

        "d-none"

    );



    pdfPreviewPlaceholder.classList.remove(

        "d-none"

    );



    pdfPreviewContainer.classList.add(

        "d-none"

    );



}





// ====================================

// RESET ANSWER

// ====================================



function resetAnswer() {



    answerCard.classList.add(

        "d-none"

    );



    answerText.textContent =

        "";



    errorBox.textContent =

        "";



    errorBox.classList.add(

        "d-none"

    );



}





// ====================================

// SELECT PDF

// ====================================



pdfFile.addEventListener(

    "change",

    function () {



        const file =

            pdfFile.files[0];





        if (!file) {

            return;

        }





        // Store PDF separately.



        selectedPdfFile =

            file;



        uploadedSuccessfully =

            false;





        // ====================================

        // VALIDATE PDF

        // ====================================



        if (!isPdf(file)) {



            pdfFile.value = "";



            selectedPdfFile =

                null;



            fileLabel.textContent =

                "Choose a PDF";





            hidePdfPreview();





            setStatus(

                "failed",

                "Only PDF files are allowed.",

                file.name

            );



            return;



        }





        // ====================================

        // SHOW SELECTED FILE

        // ====================================



        fileLabel.textContent =

            file.name;





        // ====================================

        // SHOW SELECTED STATUS

        // ====================================



        setStatus(

            "selected",

            "PDF selected. Click Upload PDF.",

            file.name

        );





        // ====================================

        // SHOW PDF PREVIEW OPTION

        // ====================================



        showSelectedPdf(file);





        // ====================================

        // RESET PROGRESS

        // ====================================



        setProgress(

            0,

            false

        );





        // ====================================

        // RESET ANSWER

        // ====================================



        resetAnswer();



    }

);





// ====================================

// OPEN PDF PREVIEW

// ====================================



openPreviewButton.addEventListener(

    "click",

    function (event) {



        event.preventDefault();



        event.stopPropagation();





        // Use stored PDF.



        const file =

            selectedPdfFile;





        if (!isPdf(file)) {



            return;



        }





        // Create URL if necessary.



        if (!selectedPdfUrl) {



            createPdfUrl(file);



        }





        // Set PDF viewer.



        pdfViewer.src =

            selectedPdfUrl;





        previewFileName.textContent =

            file.name;



        viewerFileName.textContent =

            file.name;





        // Hide placeholder.



        pdfPreviewPlaceholder.classList.add(

            "d-none"

        );





        // Show viewer.



        pdfViewerWrapper.classList.remove(

            "d-none"

        );



    }

);





// ====================================

// CLOSE PDF PREVIEW

// ====================================



closePreviewButton.addEventListener(

    "click",

    function (event) {



        event.preventDefault();



        event.stopPropagation();





        pdfViewer.src = "";





        pdfViewerWrapper.classList.add(

            "d-none"

        );





        pdfPreviewPlaceholder.classList.remove(

            "d-none"

        );



    }

);





// ====================================

// UPLOAD PDF

// ====================================



uploadButton.addEventListener(

    "click",

    function (event) {



        event.preventDefault();



        event.stopPropagation();





        // ====================================

        // USE STORED PDF

        // ====================================



        const file =

            selectedPdfFile;





        // ====================================

        // NO PDF

        // ====================================



        if (!file) {



            setStatus(

                "failed",

                "Please choose a PDF first.",

                "No PDF selected"

            );



            return;



        }





        // ====================================

        // INVALID PDF

        // ====================================



        if (!isPdf(file)) {



            setStatus(

                "failed",

                "Only PDF files are allowed.",

                file.name

            );



            return;



        }





        // ====================================

        // DISABLE UPLOAD BUTTON

        // ====================================



        uploadButton.disabled =

            true;





        uploadedSuccessfully =

            false;





        // ====================================

        // SHOW UPLOADING STATUS

        // ====================================



        setStatus(

            "uploading",

            "Uploading PDF...",

            file.name

        );





        setProgress(

            0,

            true

        );





        // ====================================

        // FORM DATA

        // ====================================



        const formData =

            new FormData();





        formData.append(

            "pdf",

            file

        );





        // ====================================

        // CREATE XHR

        // ====================================



        const xhr =

            new XMLHttpRequest();





        xhr.open(

            "POST",

            `${API_URL}/api/upload`

        );





        xhr.responseType =

            "json";





        // ====================================

        // UPLOAD PROGRESS

        // ====================================



        xhr.upload.addEventListener(

            "progress",

            function (event) {



                if (

                    !event.lengthComputable

                ) {



                    return;



                }





                const percent =

                    Math.round(

                        (

                            event.loaded /

                            event.total

                        ) * 100

                    );





                setProgress(

                    percent,

                    true

                );





                if (

                    percent < 100

                ) {



                    documentStatus.textContent =

                        `Uploading... ${percent}%`;



                } else {



                    documentStatus.textContent =

                        "Processing PDF...";



                }



            }

        );





        // ====================================

        // SERVER RESPONSE

        // ====================================



        xhr.addEventListener(

            "load",

            function () {



                setProgress(

                    100,

                    false

                );





                let data =

                    xhr.response;





                if (!data) {



                    try {



                        data =

                            JSON.parse(

                                xhr.responseText

                            );



                    } catch {



                        data = {};



                    }



                }





                // ====================================

                // SUCCESS

                // ====================================



                if (

                    xhr.status >= 200 &&

                    xhr.status < 300

                ) {



                    uploadedSuccessfully =

                        true;





                    // ====================================

                    // SHOW SUCCESS STATUS

                    // ====================================



                    setStatus(

                        "success",

                        "PDF uploaded successfully. You can now ask questions.",

                        file.name

                    );





                    // ====================================

                    // CLEAR UPLOAD INPUT

                    // ====================================

                    //

                    // This removes the filename from

                    // the upload/choose-PDF area.

                    //

                    // The actual PDF is still stored in

                    // selectedPdfFile.



                    pdfFile.value = "";





                    fileLabel.textContent =

                        "Choose a PDF";





                    // ====================================

                    // REMOVE PDF PREVIEW

                    // ====================================

                    //

                    // Preview is needed before upload.

                    // After successful upload it disappears.



                    hidePdfPreview();





                    // ====================================

                    // LOG SUCCESS

                    // ====================================



                    console.log(

                        "Upload successful:",

                        data

                    );



                }





                // ====================================

                // FAILURE

                // ====================================



                else {



                    uploadedSuccessfully =

                        false;





                    setStatus(

                        "failed",

                        data.error ||

                        "PDF upload failed.",

                        file.name

                    );





                    // Keep preview available when

                    // upload fails so the user can

                    // still inspect the PDF.



                    pdfPreviewContainer.classList.remove(

                        "d-none"

                    );





                    console.error(

                        "Upload failed:",

                        data

                    );



                }





                // ====================================

                // ENABLE BUTTON

                // ====================================



                uploadButton.disabled =

                    false;



            }

        );





        // ====================================

        // NETWORK ERROR

        // ====================================



        xhr.addEventListener(

            "error",

            function () {



                uploadedSuccessfully =

                    false;





                setProgress(

                    0,

                    false

                );





                setStatus(

                    "failed",

                    "Cannot connect to the backend. Make sure the server is running.",

                    file.name

                );





                // Keep preview on failure.



                pdfPreviewContainer.classList.remove(

                    "d-none"

                );





                uploadButton.disabled =

                    false;



            }

        );





        // ====================================

        // TIMEOUT

        // ====================================



        xhr.addEventListener(

            "timeout",

            function () {



                uploadedSuccessfully =

                    false;





                setProgress(

                    0,

                    false

                );





                setStatus(

                    "failed",

                    "Upload timed out. Please try again.",

                    file.name

                );





                // Keep preview on failure.



                pdfPreviewContainer.classList.remove(

                    "d-none"

                );





                uploadButton.disabled =

                    false;



            }

        );





        // ====================================

        // SEND PDF

        // ====================================



        xhr.send(

            formData

        );



    }

);





// ====================================

// ASK QUESTION

// ====================================



async function askQuestion() {



    const question =

        questionInput.value.trim();





    // ====================================

    // EMPTY QUESTION

    // ====================================



    if (!question) {



        return;



    }





    // ====================================

    // CHECK UPLOAD

    // ====================================



    if (!uploadedSuccessfully) {



        answerCard.classList.remove(

            "d-none"

        );





        loading.classList.add(

            "d-none"

        );





        answerText.textContent =

            "";





        errorBox.textContent =

            "Please upload a PDF successfully before asking a question.";





        errorBox.classList.remove(

            "d-none"

        );





        return;



    }





    // ====================================

    // DISABLE ASK BUTTON

    // ====================================



    askButton.disabled =

        true;





    // ====================================

    // SHOW ANSWER CARD

    // ====================================



    answerCard.classList.remove(

        "d-none"

    );





    loading.classList.remove(

        "d-none"

    );





    answerText.textContent =

        "";





    answerText.classList.add(

        "d-none"

    );





    errorBox.textContent =

        "";



    errorBox.classList.add(

        "d-none"

    );





    try {



        // ====================================

        // SEND QUESTION

        // ====================================



        const response =

            await fetch(

                `${API_URL}/api/ask`,

                {



                    method:

                        "POST",



                    headers: {



                        "Content-Type":

                            "application/json"



                    },



                    body:

                        JSON.stringify({



                            question:

                                question



                        })



                }

            );





        // ====================================

        // READ RESPONSE

        // ====================================



        const data =

            await response.json();





        // ====================================

        // HANDLE ERROR

        // ====================================



        if (!response.ok) {



            throw new Error(

                data.error ||

                "Failed to get answer."

            );



        }





        // ====================================

        // SHOW ANSWER

        // ====================================



        answerText.textContent =

            data.answer ||

            "No answer received.";





        answerText.classList.remove(

            "d-none"

        );





    } catch (error) {



        console.error(

            "Question error:",

            error

        );





        errorBox.textContent =

            error.message ||

            "Failed to get answer.";





        errorBox.classList.remove(

            "d-none"

        );





    } finally {



        loading.classList.add(

            "d-none"

        );





        askButton.disabled =

            false;



    }



}





// ====================================

// ASK BUTTON

// ====================================



askButton.addEventListener(

    "click",

    function (event) {



        event.preventDefault();



        event.stopPropagation();



        askQuestion();



    }

);





// ====================================

// CTRL + ENTER

// ====================================



questionInput.addEventListener(

    "keydown",

    function (event) {



        if (

            event.key === "Enter" &&

            event.ctrlKey

        ) {



            event.preventDefault();



            askQuestion();



        }



    }

);





// ====================================

// CLEAN PDF URL

// ====================================



window.addEventListener(

    "beforeunload",

    function () {



        if (selectedPdfUrl) {



            URL.revokeObjectURL(

                selectedPdfUrl

            );



        }



    }

);
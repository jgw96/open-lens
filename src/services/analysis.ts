export async function analyzeImage(blob: Blob) {
    // analyze image with the Azure Cognitive Services Image Analysis api
    const response = await fetch('https://westus2.api.cognitive.microsoft.com/vision/v2.0/analyze?visualFeatures=Categories,Description,Color&language=en', {
        method: "POST",
        headers: {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": "d930861b5bba49e5939b843f9c4e5846"
        },
        body: blob
    });

    const data = await response.json();

    return data;
}
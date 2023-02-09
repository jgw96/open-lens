export async function initText(imageData: Blob) {
    const response = await fetch('https://westus2.api.cognitive.microsoft.com/vision/v2.0/read/core/asyncBatchAnalyze', {
        method: "POST",
        headers: {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": "d930861b5bba49e5939b843f9c4e5846"
        },
        body: imageData

    });

    const data = await response.text();
    console.log(data);

    const respHeaders = response.headers.get('Operation-Location');
    return respHeaders;
}

export async function getTextData(resp: any) {
    const newResponse = await fetch(resp, {
        headers: {
            "Ocp-Apim-Subscription-Key": "d930861b5bba49e5939b843f9c4e5846"
        }
    });

    const newData = await newResponse.json();
    return newData;
}
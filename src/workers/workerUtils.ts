// WebWorker helper class
export function createWebWorker(worker : any) : Worker {
    let code = worker.toString();
    code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

    const blob = new Blob([code], { type: "application/javascript" });
    return new Worker(URL.createObjectURL(blob));
}


// @args: You can pass your worker parameters on initialisation
export function BookmarkWorker() {

    let onmessage = ({ data: { query, api }} : { data :  { query : string, api : typeof chrome.bookmarks } }) => { // eslint-disable-line no-unused-vars
        console.log(query); 
    // let onmessage = ({ data } : any) => { // eslint-disable-line no-unused-vars
        // Write your code here...
        api.get(query, (nodes) => {
            //@ts-ignore
            postMessage(nodes);
        })

       
    };
}

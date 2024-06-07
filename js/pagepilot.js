(function() {
    // Create styles
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        .floating-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            transition: background-color 0.3s ease;
        }
        .floating-button:hover {
            background-color: #0056b3;
        }
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 999;
            padding: 10px;
            box-sizing: border-box;
        }
        .overlay iframe {
            width: 100%;
            max-width: 600px;
            height: 80%;
            border: none;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(style);

    // Create the floating button
    var button = document.createElement("button");
    button.innerHTML = "&#128105;&#9992;";
    button.classList.add("floating-button");
    document.body.appendChild(button);

    // Create the overlay
    var overlay = document.createElement("div");
    overlay.classList.add("overlay");
    var iframe = document.createElement("iframe");
    iframe.frameBorder = "0";
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.classList.add("__page-pilot__");
    iframe.srcdoc = `
        <html>
            <head>
                <style>
                    body {
                        background-color: transparent;
                        color: white;
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        box-sizing: border-box;
                    }
                    form {
                        width: 90%;
                        max-width: 600px;
                        display: flex;
                        gap: 10px;
                        padding: 10px;
                        box-sizing: border-box;
                    }
                    input[type="text"] {
                        flex-grow: 1;
                        padding: 0px;
                        border: none;
                        border-radius: 10px;
                        font-size: 16px;
                        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.2);
                    }
                    input[type="submit"] {
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        padding: 10px 10px;
                        cursor: pointer;
                        font-size: 16px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                        transition: background-color 0.3s ease;
                    }
                    input[type="submit"]:hover {
                        background-color: #0056b3;
                    }
                    #response {
                        width: 90%;
                        max-width: 600px;
                        padding: 10px;
                        font-size: 16px;
                        background-color: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                        margin-top: 20px;
                        overflow-y: auto;
                        max-height: 40%;
                    }
                </style>
            </head>
            <body>
                <form id="prompt-form">
                    <input type="text" id="ai-prompt" name="ai-prompt" placeholder="Enter your prompt...">
                    <input type="submit" value="Submit">
                </form>
                <div id="response"></div>
                <div id="response1"></div>
            </body>
            <script>
                const data = {
                    "messages": [],
                    "model": "llama3-8b-8192"
                };

                let marked;

                const loadMarked = () => {
                    if (!window.marked) {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.umd.min.js';
                        document.head.append(script);

                        script.onload = () => {
                            marked = window.marked.marked;
                            console.log('marked loaded');
                        };
                    } else {
                        marked = window.marked.marked;
                    }
                };

                loadMarked();

                function processStreamedData(data, isFinal = false) {
                    const lines = data.split('\\n');
                    let val = "";

                    for (const line of lines) {
                        if (line.trim() === '') continue;

                        const [type, content] = line.split(':', 2);
                        if (!content) continue;

                        if (type === '2') {
                            try {
                                const jsonData = JSON.parse(content);
                                console.log('JSON Data:', jsonData);
                            } catch (error) {
                                console.error('Error parsing JSON: with 2');
                            }
                        } else if (type === '0') {
                            try {
                                const jsonData = JSON.parse(content);
                                val += jsonData;
                            } catch (error) {
                                val += content.trim().replace(/^"|"$/g, ''); // Remove leading and trailing quotes
                                console.log('Text Data:', content);
                            }
                        }
                    }
                    return val;
                }

                async function handleSubmit(event) {
                    event.preventDefault();

                    const inputText = document.getElementById('ai-prompt').value;
                    //document.getElementById('ai-prompt').value="";
                    let value = "";
                    let isLoading = true;

                    const obj = { 
                      "role": "user", 
                      "prompt": inputText,
                      "context": contextFromOutsideIframe,
                      //"linkList": linkListFromOutsideIframe 
                      
                    };
                    data.messages.push(obj);

                    try {
                        const context = {
                            method: "POST",
                            body: JSON.stringify(obj),
                            headers: {
                                'Authorization': "Bearer", // Add your token here if needed
                                'Content-Type': 'application/json'
                            }
                        };

                        const url = 'https://aik-bice.vercel.app/api/completion'; // Replace with your API endpoint
                        for await (let chunk of streamingFetch(() => fetch(url, context))) {
                            try {
                                value += processStreamedData(chunk);
                                document.getElementById('response').innerHTML = marked ? marked(value) : value;
                            } catch (error) {
                                console.log(error);
                            }
                        }
                        isLoading = false;
                    } catch (error) {
                        console.error(error);
                        isLoading = false;
                    }
                }

                async function* streamingFetch(fetchCall) {
                    const response = await fetchCall();

                    // Attach Reader
                    const reader = response.body.getReader();

                    while (true) {
                        // wait for next encoded chunk
                        const { done, value } = await reader.read();

                        // check if stream is done
                        if (done) break;

                        // Decodes data chunk and yields it
                        const val = (new TextDecoder("utf-8").decode(value));
                        yield val;
                    }
                }

                let contextFromOutsideIframe = '';
                let linkListFromOutsideIframe = [];

                window.addEventListener('message', function(event) {
                    const data = event.data;
                    contextFromOutsideIframe = data.context;
                    linkListFromOutsideIframe = data.linkList;
                    // Do something with the context and linkList data
                    document.getElementById('response1').innerHTML = contextFromOutsideIframe;
                }, false);

                document.getElementById('prompt-form').addEventListener('submit', handleSubmit);
            </script>
        </html>
    `;
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    // Get the context from the webpage
    function getContentAndText() {
        let content = "";
        let linkList = [];

        const tinymce = document.body.querySelector('.tox-edit-area iframe') || document.querySelector('.tox-edit-area iframe');
        const iframe = document.querySelector('iframe') || document.body.querySelector('iframe');
        const body = document.body.innerHTML
    if (tinymce && tinymce.contentDocument) {
        content = tinymce.contentDocument.body.innerHTML;
    } else if (iframe && iframe.contentDocument && !iframe.classList.contains("__page-pilot__")) {
        content = iframe.contentDocument.body.innerHTML;
    } else {
        console.log('No visible content found');
    }

    const div = document.createElement('div');
    div.innerHTML = content + body;
    const textContent = div.textContent || div.innerText || "";

    const links = div.querySelectorAll('a');
    links.forEach((link, index) => {
        if (index === 100) return;
        const linkText = link.textContent;
        if (!linkList.find(i => i?.url == link?.href)) linkList.push({ text: linkText, url: link.href });
    });

    let context = `<#page-context>${textContent}<##page-context>`;
    context += `<#links-in-the-page>${JSON.stringify(linkList)}<##links-in-the-page>. <#current-window-location>${window?.location?.href}<##current-window-location>`

    return { context, linkList };
  }

  // Show overlay on button click and pass the context to the iframe
  button.addEventListener("click", function() {
    const { context, linkList } = getContentAndText();
    iframe.contentWindow.postMessage({ context, linkList }, '*');
    
		if (overlay.style.display == "none" || overlay.style.display != "flex") {
			overlay.style.display = "flex";
		} else {
      overlay.style.display = "none";
    }
  });

  // Hide overlay when clicking outside the iframe
  overlay.addEventListener("click", function(event) {
    if (event.target === overlay) {
      overlay.style.display = "none";
    }
  });
})();

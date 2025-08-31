/**
 * Searches the Naver Blog API for a given query using a public CORS proxy.
 * This method is used to bypass browser CORS (Cross-Origin Resource Sharing) restrictions
 * during development without needing a self-hosted server-side proxy.
 *
 * NOTE: Public proxies can be unreliable and are not recommended for production environments.
 * For a live application, a dedicated server-side proxy is the best practice.
 * 
 * @param query The search term.
 * @param clientId Your Naver application's Client ID.
 * @param clientSecret Your Naver application's Client Secret.
 * @returns A promise that resolves to the list of blog items from the API response.
 */
export const searchNaverBlogs = async (query: string, clientId: string, clientSecret: string) => {
    const naverApiUrl = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=10&sort=sim`;
    
    // Using a different public CORS proxy that is generally more stable.
    const proxyUrl = `https://corsproxy.io/?${naverApiUrl}`;

    try {
        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                // The proxy forwards these headers to the Naver API.
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
        });

        if (!response.ok) {
            // Try to parse error message from Naver if available
            try {
                const errorData = await response.json();
                throw new Error(`Naver API error: ${errorData.errorMessage || response.statusText}`);
            } catch (e) {
                 // This will catch JSON parsing errors if the proxy returns HTML, etc.
                 const errorText = await response.text(); // Get the raw response text for debugging
                 console.error("Non-JSON response from proxy:", errorText);
                 const errorMessage = e instanceof Error ? e.message : `Request failed with status: ${response.status}`;
                 throw new Error(`Naver API request failed. The proxy may be down or blocking the request. ${errorMessage}`);
            }
        }

        const data = await response.json();
        return data.items; // The 'items' array contains the list of blogs
    } catch (error) {
        // This catch block will handle network errors (e.g., TypeError: Failed to fetch)
        console.error("Fetch error:", error);
        if (error instanceof TypeError) {
             throw new Error("네트워크 오류가 발생했습니다. 공개 프록시 서버가 불안정할 수 있습니다.");
        }
        // Re-throw other errors
        throw error;
    }
};
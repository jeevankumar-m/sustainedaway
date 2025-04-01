export async function postTweet(text, imageData = null) {
    try {
      const response = await fetch('http://localhost:5000/api/tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text,
          imageData
        })
      });
  
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to post tweet');
      }
  
      return result; // Now includes tweetUrl
    } catch (error) {
      console.error('Twitter service error:', error);
      throw error;
    }
  }
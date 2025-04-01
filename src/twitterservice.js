export async function postTweet(text) {
    try {
      console.log('Attempting to post tweet:', text);
      const response = await fetch('http://localhost:5000/api/tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
  
      const result = await response.json();
      console.log('Backend response:', result);
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to post tweet');
      }
  
      return result;
    } catch (error) {
      console.error('Full client-side error:', error);
      throw new Error(`Twitter service error: ${error.message}`);
    }
  }
/**
 * Parse a profile URL to extract platform and basic info
 */
export function parseProfileUrl(url: string): {
  platform: string;
  username?: string;
  displayName?: string;
} | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Facebook
    if (hostname.includes('facebook.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const username = pathParts[0] || pathParts[pathParts.length - 1];
      return {
        platform: 'facebook',
        username: username,
        displayName: username,
      };
    }
    
    // Instagram
    if (hostname.includes('instagram.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const username = pathParts[0];
      return {
        platform: 'instagram',
        username: username ? `@${username}` : undefined,
        displayName: username,
      };
    }
    
    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      // Handle different YouTube URL formats
      let channelId: string | undefined;
      let username: string | undefined;
      
      if (urlObj.pathname.startsWith('/channel/')) {
        channelId = urlObj.pathname.split('/channel/')[1]?.split('/')[0];
      } else if (urlObj.pathname.startsWith('/c/')) {
        username = urlObj.pathname.split('/c/')[1]?.split('/')[0];
      } else if (urlObj.pathname.startsWith('/user/')) {
        username = urlObj.pathname.split('/user/')[1]?.split('/')[0];
      } else if (urlObj.pathname.startsWith('/@')) {
        username = urlObj.pathname.split('/@')[1]?.split('/')[0];
      }
      
      return {
        platform: 'youtube',
        username: username || channelId,
        displayName: username || channelId,
      };
    }
    
    // Spotify
    if (hostname.includes('spotify.com') || hostname.includes('open.spotify.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'user' || pathParts[0] === 'artist') {
        const username = pathParts[1];
        return {
          platform: 'spotify',
          username: username,
          displayName: username,
        };
      }
    }
    
    // Twitter/X
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const username = pathParts[0];
      return {
        platform: 'twitter',
        username: username ? `@${username}` : undefined,
        displayName: username,
      };
    }
    
    // LinkedIn
    if (hostname.includes('linkedin.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'in' || pathParts[0] === 'pub') {
        const username = pathParts[1];
        return {
          platform: 'linkedin',
          username: username,
          displayName: username,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing profile URL:', error);
    return null;
  }
}


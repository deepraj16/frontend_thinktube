import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [isVideoInitialized, setIsVideoInitialized] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const API_BASE_URL = 'https://backend-of-thinktube.onrender.com/';

  useEffect(() => {
    // Focus on video URL input when component mounts
    document.getElementById('videoUrl')?.focus();
  }, []);

  // Extract video ID from URL
  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Show status message
  const showStatus = (message, type) => {
    setError({ message, type });
    
    // Auto-hide success and info messages
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  // Load video function
  const loadVideo = async () => {
    if (!videoUrl.trim()) {
      showStatus('Please enter a YouTube URL', 'error');
      return;
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      showStatus('Please enter a valid YouTube URL', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/get_youtube_video_info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: videoUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentVideoId(data.video_id);
        setVideoInfo({ ...data, extractedVideoId: videoId });
        showStatus('✅ Video loaded successfully! You can now ask questions.', 'success');
        setShowChat(true);
        setMessages([{
          type: 'assistant',
          content: '👋 Hi! I\'ve analyzed your video and I\'m ready to answer any questions you have about it. What would you like to know?',
          timestamp: new Date()
        }]);

        // Initialize video in background
        initializeVideo();
      } else {
        showStatus(`❌ Error: ${data.error}`, 'error');
        setVideoInfo(null);
      }
    } catch (error) {
      showStatus(`❌ Network error: ${error.message}`, 'error');
      setVideoInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Initialize video for faster queries
  const initializeVideo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/initialize_video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setIsVideoInitialized(true);
        showStatus('🚀 Video initialized! Questions will be answered faster now.', 'info');
      }
    } catch (error) {
      console.log('Video initialization failed, but queries will still work');
    }
  };

  // Ask question function
  const askQuestion = async () => {
    if (!question.trim()) return;

    if (!currentVideoId) {
      showStatus('Please load a video first', 'error');
      return;
    }

    // Add user message
    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/quick_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question
        })
      });

      const data = await response.json();

      const assistantMessage = {
        type: 'assistant',
        content: response.ok ? data.answer : `❌ Error: ${data.error}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'assistant',
        content: `❌ Network error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Quick question function
  const askQuickQuestion = (questionText) => {
    setQuestion(questionText);
    setTimeout(() => askQuestion(), 100);
  };

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      askQuestion();
    }
  };

  const getStatusColors = (type) => {
    const colors = {
      success: 'from-green-600 to-emerald-700 border-green-500',
      error: 'from-red-600 to-pink-700 border-red-500',
      info: 'from-blue-600 to-purple-700 border-blue-500'
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="min-h-screen p-2 md:p-6">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full animate-float blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full animate-bounce-slow blur-2xl"></div>
        <div className="absolute top-1/2 left-3/4 w-48 h-48 bg-gradient-to-r from-blue-500/20 to-purple-400/20 rounded-full animate-pulse-slow blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass rounded-3xl mb-8 p-8 md:p-12 text-center relative overflow-hidden animate-fade-in neon-border">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black gradient-text mb-4 drop-shadow-lg text-shadow animate-glow">
              🎥 YouTube AI Assistant
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-medium">
              Analyze videos with AI • Get instant answers • Discover insights
            </p>
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shimmer"></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Video Input */}
          <div className="lg:col-span-1 space-y-6">
            {/* Video Input Card */}
            <div className="glass rounded-2xl p-6 animate-slide-up hover-glow transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 cyan-gradient rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-black text-lg font-bold">📺</span>
                </div>
                <h2 className="text-2xl font-bold text-white text-shadow">Load Video</h2>
              </div>

              <div className="space-y-4">
                <input 
                  id="videoUrl"
                  type="text" 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-black/60 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                  placeholder="Paste YouTube URL here..."
                />
                <button 
                  onClick={loadVideo}
                  disabled={loading}
                  className="w-full px-6 py-3 cyan-gradient text-black font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-cyan-400/50 relative overflow-hidden disabled:opacity-75"
                >
                  <span className="relative z-10">
                    {loading ? 'Loading...' : 'Load Video'}
                  </span>
                </button>
              </div>

              {/* Status Message */}
              {error && (
                <div className="mt-4">
                  <div className={`p-3 bg-gradient-to-r ${getStatusColors(error.type)} rounded-xl text-white text-sm font-medium animate-fade-in border shadow-lg`}>
                    {error.message}
                  </div>
                </div>
              )}
            </div>

            {/* Video Info Card
            {videoInfo && (
              <div className="glass rounded-2xl p-6 animate-fade-in hover-glow transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                  <h3 className="text-lg font-bold text-white text-shadow">Video Loaded</h3>
                </div>

                <div className="mb-4">
                  <img 
                    src={`https://img.youtube.com/vi/${videoInfo.extractedVideoId}/maxresdefault.jpg`}
                    alt="Video thumbnail" 
                    className="w-full video-thumbnail rounded-xl shadow-lg border border-gray-600"
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${videoInfo.extractedVideoId}/hqdefault.jpg`;
                    }}
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Video ID:</span>
                    <span className="text-white font-mono text-xs bg-gray-800 px-2 py-1 rounded border border-gray-600">
                      {videoInfo.extractedVideoId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400 font-medium">{videoInfo.status}</span>
                  </div>
                </div>
              </div>
            )} */}

            {/* Video Info Card */}
{videoInfo && (
  <div className="glass rounded-2xl p-6 animate-fade-in hover-glow transition-all duration-300">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
        <span className="text-black text-sm font-bold">▶</span>
      </div>
      <h3 className="text-lg font-bold text-white text-shadow">Video Player</h3>
    </div>

    <div className="mb-4">
      {/* Enhanced YouTube Video Player */}
      <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-cyan-400/30">
        <iframe
          width="100%"
          height="220"
          src={`https://www.youtube.com/embed/${videoInfo.extractedVideoId}?rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=0&start=0&enablejsapi=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="video-thumbnail rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #0f0520 0%, #1a0a2a 100%)'
          }}
        ></iframe>
        
        Optional: Video overlay with glow effect
        <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-cyan-400/20 shadow-inner"></div>
      </div>
      
      {/* Video Controls */}
      <div className="flex items-center justify-between mt-3 px-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span>Live Player</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.open(`https://www.youtube.com/watch?v=${videoInfo.extractedVideoId}`, '_blank')}
            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs rounded-lg transition-all duration-300 hover:scale-105"
          >
            Open in YouTube
          </button>
        </div>
      </div>
    </div>

    <div className="space-y-2 text-sm">
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Video ID:</span>
        <span className="text-white font-mono text-xs bg-gray-800 px-2 py-1 rounded border border-gray-600">
          {videoInfo.extractedVideoId}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Status:</span>
        <span className="text-green-400 font-medium">{videoInfo.status}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Player:</span>
        <span className="text-cyan-400 font-medium flex items-center gap-1">
          <span>🎬</span>
          YouTube Embedded
        </span>
      </div>
    </div>
  </div>
)}



            {/* Quick Actions */}
            {videoInfo && (
              <div className="glass rounded-2xl p-6 animate-fade-in hover-glow transition-all duration-300">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 text-shadow">
                  <span className="text-xl">⚡</span>
                  Quick Questions
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { emoji: '📝', text: 'Summarize Video', question: 'Can you summarize this video?' },
                    { emoji: '🎯', text: 'Main Points', question: 'What are the main points discussed?' },
                    { emoji: '📚', text: 'Topics Covered', question: 'What topics are covered?' },
                    { emoji: '👥', text: 'Target Audience', question: 'Who is the target audience?' }
                  ].map((btn, index) => (
                    <button 
                      key={index}
                      onClick={() => askQuickQuestion(btn.question)}
                      className="px-4 py-3 bg-gray-800/70 hover:bg-gray-700/70 border border-gray-600 hover:border-yellow-400 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 text-left flex items-center gap-3 hover:shadow-lg"
                    >
                      <span className="text-lg">{btn.emoji}</span>
                      <span>{btn.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-2">
            {showChat ? (
              <div className="glass rounded-2xl p-6 h-full min-h-[600px] flex flex-col animate-fade-in hover-glow transition-all duration-300">
                {/* Chat Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-600">
                  <div className="w-10 h-10 silver-gradient rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-black text-lg font-bold">💬</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white text-shadow">AI Chat</h2>
                    <p className="text-gray-400 text-sm">Ask me anything about the video</p>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 text-xs font-medium">Active</span>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 space-y-4 mb-6 overflow-y-auto custom-scrollbar pr-2">
                  {messages.map((message, index) => (
                    <div key={index} className="flex items-start gap-3 animate-fade-in">
                      {message.type === 'user' ? (
                        <div className="ml-auto flex items-start gap-3 flex-row-reverse max-w-[80%]">
                          <div className="w-8 h-8 gold-gradient rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-black text-sm font-bold">👤</span>
                          </div>
                          <div className="gold-gradient rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
                            <p className="text-black text-sm leading-relaxed font-medium">{message.content}</p>
                            <p className="text-black/70 text-xs mt-1">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-8 h-8 silver-gradient rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-black text-sm font-bold">🤖</span>
                          </div>
                          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] border border-gray-600 shadow-lg">
                            <p className="text-gray-200 text-sm leading-relaxed">{message.content}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {loading && (
                    <div className="mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 silver-gradient rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-black text-sm font-bold">🤖</span>
                        </div>
                        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-600">
                          <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <span className="ml-2 text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                    placeholder="Ask a question about the video..."
                    disabled={loading}
                  />
                  <button 
                    onClick={askQuestion}
                    disabled={loading}
                    className="px-6 py-3 silver-gradient text-black font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-gray-400/50 flex items-center gap-2 disabled:opacity-75"
                  >
                    <span className="text-black">{loading ? 'Sending...' : 'Send'}</span>
                    <span className="text-lg">🚀</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Initial State */
              <div className="glass rounded-2xl p-12 text-center animate-fade-in hover-glow transition-all duration-300">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow shadow-lg border border-gray-500">
                  <span className="text-white text-3xl">🎬</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-shadow">Ready to Analyze</h3>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                  Load a YouTube video to start asking questions and get AI-powered insights about the content.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                  {['Video Summarization', 'Content Analysis', 'Q&A Chat'].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-600">
                      <span className="text-green-400">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

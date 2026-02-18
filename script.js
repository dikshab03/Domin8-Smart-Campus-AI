// Chatbot variables
let isChatbotOpen = false;
let isTyping = false;
let isListening = false;
let recognition = null;
let finalTranscript = '';
let micPermission = false;

// Check browser support on load
document.addEventListener('DOMContentLoaded', function() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        document.getElementById('voiceStatus').innerHTML = ' Voice not supported. Please use Chrome.';
        document.getElementById('voiceBtn').style.opacity = '0.5';
        document.getElementById('voiceBtn').disabled = true;
    }
});

// Toggle chatbot
function toggleChatbot() {
    const container = document.getElementById('chatbotContainer');
    const button = document.getElementById('chatbotButton');
    
    isChatbotOpen = !isChatbotOpen;
    
    if (isChatbotOpen) {
        container.style.display = 'block';
        button.style.animation = 'none';
    } else {
        container.style.display = 'none';
        button.style.animation = 'pulse 2s infinite';
        if (isListening) {
            stopListening();
        }
    }
}

// Initialize voice recognition
function initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        try {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = function() {
                isListening = true;
                document.getElementById('voiceBtn').classList.add('listening');
                document.getElementById('voiceWave').classList.add('active');
                document.getElementById('userInput').placeholder = 'Listening... Speak now';
                document.getElementById('voiceStatus').innerHTML = '🎤 Listening...';
            };

            recognition.onresult = function(event) {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript = transcript;
                        document.getElementById('userInput').value = finalTranscript;
                    } else {
                        interimTranscript = transcript;
                        document.getElementById('userInput').value = interimTranscript;
                    }
                }
            };

            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                stopListening();
                
                let errorMsg = '';
                if (event.error === 'not-allowed') {
                    errorMsg = 'Microphone access denied. Please allow access.';
                } else if (event.error === 'no-speech') {
                    errorMsg = ' No speech detected. Please try again.';
                } else {
                    errorMsg = ' Error: ' + event.error + '. Try again.';
                }
                document.getElementById('voiceStatus').innerHTML = errorMsg;
            };

            recognition.onend = function() {
                if (isListening) {
                    if (finalTranscript && finalTranscript.trim() !== '') {
                        document.getElementById('userInput').value = finalTranscript;
                        sendMessage();
                    }
                    stopListening();
                }
            };

            return true;
        } catch (error) {
            console.error('Failed to initialize:', error);
            return false;
        }
    }
    return false;
}

function stopListening() {
    if (recognition && isListening) {
        try {
            recognition.stop();
        } catch (error) {}
    }
    isListening = false;
    document.getElementById('voiceBtn').classList.remove('listening');
    document.getElementById('voiceWave').classList.remove('active');
    document.getElementById('userInput').placeholder = 'Type your question...';
    document.getElementById('voiceStatus').innerHTML = 'Click  to speak';
    finalTranscript = '';
}

function toggleVoiceRecognition() {
    if (!recognition) {
        if (!initVoiceRecognition()) {
            document.getElementById('voiceStatus').innerHTML = ' Voice recognition failed to initialize';
            return;
        }
    }
    
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

function startListening() {
    try {
        // Request microphone permission first
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                stream.getTracks().forEach(track => track.stop()); // Stop the stream after permission granted
                finalTranscript = '';
                recognition.start();
            })
            .catch(function(error) {
                console.error('Microphone permission denied:', error);
                document.getElementById('voiceStatus').innerHTML = ' Microphone access denied. Please allow access.';
            });
    } catch (error) {
        console.error('Failed to start:', error);
        document.getElementById('voiceStatus').innerHTML = ' Failed to start voice recognition';
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendQuickMessage(type) {
    let message = '';
    switch(type) {
        case 'admissions': message = 'Tell me about admissions'; break;
        case 'courses': message = 'What courses are available?'; break;
        case 'fees': message = 'Tell me about fees'; break;
        case 'scholarships': message = 'Scholarship information'; break;
        case 'contact': message = 'How to contact?'; break;
        case 'hostel': message = 'Hostel facilities'; break;
        case 'library': message = 'Library details'; break;
        case 'exams': message = 'Exam schedule'; break;
    }
    document.getElementById('userInput').value = message;
    sendMessage();
}

function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    addMessage(message, 'user');
    input.value = '';
    
    if (isListening) stopListening();
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        addMessage(getBotResponse(message), 'bot');
    }, 1000);
}

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">${text.replace(/\n/g, '<br>')}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${text}</div>
            <div class="message-avatar"><i class="fas fa-user"></i></div>
        `;
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    isTyping = true;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.remove();
    isTyping = false;
}

function getBotResponse(message) {
    message = message.toLowerCase();
    
    if (message.includes('admission') || message.includes('apply')) {
        return " Admissions 2027 are now open!\n\n• Deadline: June 30, 2024\n• Eligibility: 10+2 with 60%\n• Programs: B.Sc, BBA, BA, B.Com\n\nWould you like to know about specific courses?";
    }
    else if (message.includes('course') || message.includes('program')) {
        return " Our Programs:\n\n• Computer Science (60 seats)\n• Business Admin (120 seats)\n• Physics (50 seats)\n• English Literature (40 seats)\n\nWhich one interests you?";
    }
    else if (message.includes('fee') || message.includes('cost')) {
        return "Fee Structure:\n\n• UG Programs: ₹45,000-60,000/year\n• PG Programs: ₹60,000-80,000/year\n• Hostel: ₹40,000/year\n• Transport: ₹15,000/year";
    }
    else if (message.includes('scholarship')) {
        return " Scholarships:\n\n• Merit: 100% fee waiver\n• Sports: For state/national players\n• Need-based: For weaker students\n\nDeadline: March 31, 2024";
    }
    else if (message.includes('contact')) {
        return " Contact Us:\n\n• Phone: +91 98765 43210\n• Email: info@genxcollege.edu\n• Address: 123 Education Street, City\n• Hours: Mon-Fri, 9AM-5PM";
    }
    else if (message.includes('hostel')) {
        return " Hostel Facilities:\n\n• Separate hostels for boys & girls\n• Fully furnished rooms with Wi-Fi\n• 24/7 security\n• Mess with hygienic food\n• Fees: ₹40,000/year";
    }
    else if (message.includes('library')) {
        return " Library:\n\n• 50,000+ books\n• 100+ international journals\n• Digital library with e-books\n• 24/7 reading room\n• Hours: 8 AM - 10 PM";
    }
    else if (message.includes('exam')) {
        return " Exam Schedule:\n\n• Internal Assessment 1: Aug 20-25\n• Internal Assessment 2: Oct 10-15\n• Semester Exams: Nov 15-30";
    }
    else {
        return "I can help with:\n\n• Admissions\n• Courses\n• Fees\n• Scholarships\n• Contact\n• Hostel\n• Library\n• Exams\n\nWhat would you like to know? 😊";
    }
}
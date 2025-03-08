// Firebase Configuration (Replace with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyDZ-XoIIWr2bmqF3ov_Cr61uvjrH8mdN7E",
    authDomain: "leicestermasjids.firebaseapp.com",
    projectId: "leicestermasjids",
    storageBucket: "leicestermasjids.firebasestorage.app",
    messagingSenderId: "1048621562596",
    appId: "1:1048621562596:web:1423889398aeada1d14af1",
    measurementId: "G-G75HZ0B7W0"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const postContainer = document.getElementById('post-container');

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function loadPost(postId) {
    db.collection('posts').doc(postId).get().then((doc) => {
        if (doc.exists) {
            const postData = doc.data();
            db.collection('users').doc(postData.userId).get().then((userDoc) => {
                const username = userDoc.data() ? userDoc.data().username : 'Unknown User';
                postContainer.innerHTML = `
                    <h2>${postData.title}</h2>
                    <strong style='font-style: bold;'>By ${username}</strong>
                    <p>${postData.text}</p>
		    <h2></h2>
		<h2></h2>
		<h2></h2>
		   <h2>Replies</h2>
                    <div class="replies" id="replies-${postId}">
                        </div>
                    <div class="reply-form">
                        <textarea id="reply-text-${postId}" placeholder="Leave a reply"></textarea>
                        <button onclick="createReply('${postId}')">Reply</button>
                    </div>
                `;
                loadReplies(postId);
            });
        } else {
            postContainer.innerHTML = '<p>Post not found.</p>';
        }
    }).catch((error) => {
        console.error("Error getting post:", error);
        postContainer.innerHTML = '<p>Error loading post.</p>';
    });
}

function createReply(postId) {
    const replyText = document.getElementById(`reply-text-${postId}`).value;
    if (auth.currentUser && replyText) { // Check if user is logged in and replyText is not empty
        db.collection('posts').doc(postId).collection('replies').add({
            userId: auth.currentUser.uid,
            text: replyText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            document.getElementById(`reply-text-${postId}`).value = '';
            loadReplies(postId);
        }).catch((error) => {
            console.error('Error creating reply:', error);
            alert('Failed to create reply.');
        });
    } else if (!auth.currentUser) {
        alert('You must be logged in to reply.');
    }
}

function loadReplies(postId) {
    const repliesDiv = document.getElementById(`replies-${postId}`);
    repliesDiv.innerHTML = ''; // Clear existing replies

    db.collection('posts').doc(postId).collection('replies').orderBy('timestamp', 'asc').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const reply = doc.data();
            const replyDiv = document.createElement('div');
            replyDiv.classList.add('reply');
            db.collection('users').doc(reply.userId).get().then((userDoc) => {
                const userData = userDoc.data();
                const username = userData ? userData.username : 'Unknown User';
                replyDiv.innerHTML = `
                    <h4>${username}</h4>
                    <p>${reply.text}</p>
                `;
                repliesDiv.appendChild(replyDiv);
            });
        });
    });
}

// Load post on page load
const postId = getParameterByName('id');
if (postId) {
    loadPost(postId);
}

function goBack() {
    window.history.back();
}
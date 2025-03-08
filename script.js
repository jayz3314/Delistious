// Firebase Configuration
const firebaseConfig = {
    apiKey: "REPLACE_WITH_YOUR_DATA",
    authDomain: "REPLACE_WITH_YOUR_DATA",
    projectId: "REPLACE_WITH_YOUR_DATA",
    storageBucket: "REPLACE_WITH_YOUR_DATA",
    messagingSenderId: "REPLACE_WITH_YOUR_DATA",
    appId: "REPLACE_WITH_YOUR_DATA",
    measurementId: "REPLACE_WITH_YOUR_DATA"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const contentContainer = document.getElementById('content-container');
const authContainer = document.getElementById('auth-container');
const signupUsername = document.getElementById('signup-username');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupButton = document.getElementById('signup-button');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const logoutButton = document.getElementById('logout-button');
const deleteAccountButton = document.getElementById('delete-account-button');
const postText = document.getElementById('post-text');
const createPostButton = document.getElementById('create-post-button');
const postsList = document.getElementById('posts-list');
const postTitle = document.getElementById('post-title');

// Event Listeners for Signup/Login
showSignup.addEventListener('click', () => {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
});

showLogin.addEventListener('click', () => {
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
});

signupButton.addEventListener('click', () => {
    const username = signupUsername.value;
    auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            // Add the user to the users collection
            db.collection('users').doc(user.uid).set({
                username: username
            })
            .then(() => {
                console.log('User added to Firestore!');
                // Show the content and hide the authentication container
                contentContainer.style.display = 'block';
                authContainer.style.display = 'none';
            })
            .catch((error) => {
                console.error('Error adding user to Firestore: ', error);
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Error creating user: ', errorCode, errorMessage);
        });
});

loginButton.addEventListener('click', () => {
    auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            // Show the content and hide the authentication container
            contentContainer.style.display = 'block';
            authContainer.style.display = 'none';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Error signing in: ', errorCode, errorMessage);
        });
});

logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        // Sign-out successful.
        contentContainer.style.display = 'none';
        authContainer.style.display = 'block';
      }).catch((error) => {
        // An error happened.
      });
});

deleteAccountButton.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            // 1. Delete all posts by the user
            db.collection('posts').where('userId', '==', user.uid).get()
                .then((querySnapshot) => {
                    const batch = db.batch();
                    querySnapshot.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                    return batch.commit();
                })
                .then(() => {
                    // 2. Delete the user document from the 'users' collection
                    return db.collection('users').doc(user.uid).delete();
                })
                .then(() => {
                    // 3. Delete the user from Firebase Authentication
                    return user.delete();
                })
                .then(() => {
                    alert("Account deleted successfully.");
                })
                .catch((error) => {
                    console.error("Error deleting account:", error);
                    alert("Failed to delete account.");
                });
        }
    }
});

// Create Post
createPostButton.addEventListener('click', () => {
    if (auth.currentUser) {
        db.collection('posts').add({
            title: postTitle.value,
            text: postText.value,
            userId: auth.currentUser.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            postTitle.value = '';
            postText.value = '';
            loadPosts();
        }).catch((error) => {
            console.error('Error creating post:', error);
            alert('Failed to create post.');
        });
    }
});

// Load Posts
function loadPosts() {
    postsList.innerHTML = ''; // Clear existing posts
    db.collection('posts').orderBy('timestamp', 'desc').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const postData = doc.data();
                const postId = doc.id;
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');

                db.collection('users').doc(postData.userId).get().then((userDoc) => {
                    const username = userDoc.data() ? userDoc.data().username : 'Unknown User';
                    
                    postDiv.innerHTML = `
                        <h3>${username}</h3>
                        <h4>${postData.title}</h4>
                        <a href="post.html?id=${postId}" class="view-post-button">View Post</a>
                    `;

                    postsList.appendChild(postDiv);
                });
            });
        });
}

// Load posts on page load
auth.onAuthStateChanged((user) => {
    if (user) {
        contentContainer.style.display = 'block'; // Show content
        authContainer.style.display = 'none'; // Hide auth
        loadPosts();
    } else {
        contentContainer.style.display = 'none'; // Hide content
        authContainer.style.display = 'block'; // Show auth
    }
});

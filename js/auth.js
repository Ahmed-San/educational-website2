import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// التحقق من حالة تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // التحقق من صلاحيات المستخدم
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (!adminDoc.exists()) {
                // إذا لم يكن المستخدم مسؤولاً، قم بتسجيل خروجه
                await signOut(auth);
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('خطأ في التحقق من الصلاحيات:', error);
            await signOut(auth);
            window.location.href = 'login.html';
        }
    } else {
        // إذا لم يكن هناك مستخدم مسجل، انتقل إلى صفحة تسجيل الدخول
        if (!window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});

// تبديل بين نماذج تسجيل الدخول وإنشاء الحساب
window.toggleForms = function() {
    const loginContainer = document.querySelector('.container:not(#signupContainer)');
    const signupContainer = document.getElementById('signupContainer');
    
    if (loginContainer && signupContainer) {
        if (loginContainer.style.display !== 'none') {
            loginContainer.style.display = 'none';
            signupContainer.style.display = 'block';
        } else {
            loginContainer.style.display = 'block';
            signupContainer.style.display = 'none';
        }
    }
};

// إضافة مستمعي الأحداث عند تحميل المستند
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'index.html';
            } catch (error) {
                showError('خطأ في تسجيل الدخول: ' + error.message);
            }
        });
    }

    // إنشاء حساب جديد
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showError('كلمات المرور غير متطابقة');
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                alert('تم إنشاء الحساب بنجاح!');
                window.location.href = 'index.html';
            } catch (error) {
                let errorMessage = 'خطأ في إنشاء الحساب: ';
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage += 'البريد الإلكتروني مستخدم بالفعل';
                        break;
                    case 'auth/invalid-email':
                        errorMessage += 'البريد الإلكتروني غير صالح';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage += 'تسجيل الحساب غير مفعل حالياً';
                        break;
                    case 'auth/weak-password':
                        errorMessage += 'كلمة المرور ضعيفة جداً';
                        break;
                    default:
                        errorMessage += error.message;
                }
                showError(errorMessage);
            }
        });
    }
});

// عرض رسائل الخطأ
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger mt-3';
    errorDiv.textContent = message;
    
    // إضافة رسالة الخطأ للنموذج النشط
    const activeForm = document.querySelector('form:not([style*="display: none"])');
    if (activeForm) {
        const existingError = activeForm.parentElement.querySelector('.alert');
        if (existingError) {
            existingError.remove();
        }
        activeForm.insertAdjacentElement('afterend', errorDiv);
    }
}

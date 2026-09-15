import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBwuHH4K7jzHYQcdIU70eBLknKjjfXoIK0",
  authDomain: "lccmobshop.firebaseapp.com",
  projectId: "lccmobshop",
  storageBucket: "lccmobshop.firebasestorage.app",
  messagingSenderId: "267969806536",
  appId: "1:267969806536:web:d7d6c35d33c1cd31e425fd",
};

export const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);
import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Integrate with GAS Backend
    console.log("Login attempt:", username);
    onLogin({ username, role: 'Karyawan CV' }); // Mock login
  };

  return (
    <div className="login-container">
      <h2>HRIS Portal Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password / PIN</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Masuk</button>
      </form>
    </div>
  );
};

export default Login;


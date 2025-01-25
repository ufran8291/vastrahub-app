import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';

const Root = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation />
      <main >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Root;

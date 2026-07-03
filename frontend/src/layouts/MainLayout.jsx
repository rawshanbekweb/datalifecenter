import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/common/Loader';
import ScrollTop from '../components/common/ScrollTop';
import { useScrollToHash } from '../hooks/useScrollToHash';

export default function MainLayout() {
  useScrollToHash();

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff' }}>
      <Loader/>
      <Navbar/>
      <main>
        <Outlet/>
      </main>
      <Footer/>
      <ScrollTop/>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeJsBookAnimation = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    sceneRef.current = { scene, camera, renderer };

    // Create realistic books
    const books = [];
    const bookColors = [
      '#8B5CF6', '#EF4444', '#10B981', '#F59E0B',
      '#3B82F6', '#EC4899', '#F97316', '#6366F1'
    ];

    function createBook(color) {
      const bookGroup = new THREE.Group();
      
      const width = 0.8;
      const height = 1.2;
      const depth = 0.12;
      
      // Book cover
      const coverGeometry = new THREE.BoxGeometry(width, height, 0.02);
      const coverMaterial = new THREE.MeshLambertMaterial({ color: color });
      
      const frontCover = new THREE.Mesh(coverGeometry, coverMaterial);
      frontCover.position.z = depth / 2;
      bookGroup.add(frontCover);
      
      const backCover = new THREE.Mesh(coverGeometry, coverMaterial);
      backCover.position.z = -depth / 2;
      bookGroup.add(backCover);
      
      // Pages
      const pagesGeometry = new THREE.BoxGeometry(width - 0.05, height - 0.05, depth - 0.04);
      const pagesMaterial = new THREE.MeshLambertMaterial({ color: '#F8F8F8' });
      const pages = new THREE.Mesh(pagesGeometry, pagesMaterial);
      bookGroup.add(pages);
      
      // Spine
      const spineGeometry = new THREE.BoxGeometry(0.02, height, depth);
      const spineMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color(color).multiplyScalar(0.7)
      });
      const spine = new THREE.Mesh(spineGeometry, spineMaterial);
      spine.position.x = -width / 2;
      bookGroup.add(spine);
      
      return bookGroup;
    }
    
    for (let i = 0; i < 8; i++) {
      const bookColor = bookColors[i % bookColors.length];
      const book = createBook(bookColor);
      
      book.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4
      );
      book.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      books.push({
        mesh: book,
        speed: {
          x: (Math.random() - 0.5) * 0.008,
          y: (Math.random() - 0.5) * 0.008,
          z: (Math.random() - 0.5) * 0.008
        }
      });
      
      scene.add(book);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(10, 10, 5);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-10, -10, -5);
    scene.add(directionalLight2);

    camera.position.z = 8;

    // Animation loop
    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate);

      books.forEach(book => {
        book.mesh.rotation.x += book.speed.x;
        book.mesh.rotation.y += book.speed.y;
        book.mesh.rotation.z += book.speed.z;
        
        book.mesh.position.y += Math.sin(Date.now() * 0.001 + book.mesh.position.x) * 0.002;
      });

      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '500px', 
        borderRadius: '16px' 
      }} 
    />
  );
};

export default ThreeJsBookAnimation;
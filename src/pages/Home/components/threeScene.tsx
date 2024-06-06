// src/ThreeScene.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef(new THREE.Vector2());
  const selectedObjectRef = useRef<THREE.Mesh | null>(null);
  // 创建射线可视化的函数
  const visualizeRaycaster = (
    raycaster: THREE.Raycaster,
    scene: THREE.Scene,
  ) => {
    // 移除之前的射线可视化对象（如果有的话）
    const existingRay = scene.getObjectByName('visualizedRay');
    if (existingRay) {
      scene.remove(existingRay);
    }

    // 获取射线的起点和方向
    const origin = raycaster.ray.origin;
    const direction = raycaster.ray.direction;

    // 创建射线的终点
    const length = 100; // 射线的长度
    const end = new THREE.Vector3()
      .copy(origin)
      .add(direction.multiplyScalar(length));

    // 创建几何体和材质
    const geometry = new THREE.BufferGeometry().setFromPoints([origin, end]);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

    // 创建线段并添加到场景中
    const line = new THREE.Line(geometry, material);
    line.name = 'visualizedRay';
    scene.add(line);
  };
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 创建场景
    const scene = new THREE.Scene();

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 10;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // 创建OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 启用阻尼效果
    controls.dampingFactor = 0.25; // 阻尼系数
    controls.screenSpacePanning = false; // 禁用屏幕空间平移

    // 创建射线投射器
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

    // 创建光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 创建并添加立方体
    // const boxGeometry = new THREE.BoxGeometry();
    // const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    // const cube = new THREE.Mesh(boxGeometry, boxMaterial);
    // cube.position.set(-2, 0.5, 0.5); // 将立方体移到左侧
    // scene.add(cube);
    // 创建正方体的几何体和材质
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.5,
    }); // 透视效果的蓝色材质
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(-2, 0.5, 0.5); // 将正方体移到左侧
    scene.add(cube);

    // 创建正方体的边缘几何体
    const edges = new THREE.EdgesGeometry(geometry, 0);
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
    }); // 白色线条材质
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    cube.add(wireframe); // 将线条添加到正方体中
    // 创建并添加圆柱体
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 32);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
      transparent: true,
      color: 0x0000ff,
      opacity: 0.3,
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(2, 1, 1); // 将圆柱体移到立方体右侧

    const edges_cylinder = new THREE.EdgesGeometry(cylinderGeometry, 0);
    const lineMaterial_cylinder = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
    }); // 白色线条材质
    const wireframe_cylinder = new THREE.LineSegments(edges_cylinder, lineMaterial_cylinder);
    cylinder.add(wireframe_cylinder); // 将线条添加到圆柱体中

    scene.add(cylinder);

    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // 添加网格线
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.material.color.set(0xcccccc);
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    // 过滤出场景中的 Mesh 对象
    const meshObjects = scene.children.filter(
      (obj: any) => obj instanceof THREE.Mesh,
    );
    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);

      // 更新控制器
      controls.update();

      renderer.render(scene, camera);
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (mount) {
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    const resetCurrentSelectedObject = () => {
      if (selectedObjectRef.current) {
        // 重置高亮对象材质
        selectedObjectRef.current.material =
          selectedObjectRef.current.userData.originalMaterial;
        selectedObjectRef.current = null;
      }
    };
    let mouseDownObject: any = null;
    // 处理鼠标按下事件
    const onMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      const rect = mount.getBoundingClientRect();
      mouseRef.current.x =
        ((event.clientX - rect.left) / mount.clientWidth) * 2 - 1;
      mouseRef.current.y =
        -((event.clientY - rect.top) / mount.clientHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        meshObjects,
        false,
      );

      if (intersects.length > 0) {
        mouseDownObject = intersects[0].object;
      }
    };

    // 处理鼠标松开事件
    const onMouseUp = (event: MouseEvent) => {
      event.preventDefault();
      const rect = mount.getBoundingClientRect();
      mouseRef.current.x =
        ((event.clientX - rect.left) / mount.clientWidth) * 2 - 1;
      mouseRef.current.y =
        -((event.clientY - rect.top) / mount.clientHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      // 可视化射线
      // visualizeRaycaster(raycasterRef.current, scene);
      const intersects = raycasterRef.current.intersectObjects(
        meshObjects,
        false,
      );

      if (intersects.length > 0) {
        const mouseUpObject = intersects[0].object;
        // 判断 mouseDown 和 mouseUp 的对象是否相同
        if (mouseDownObject === mouseUpObject) {
          // 触发自定义的 事件
          const e = new CustomEvent('click-in-canvas', {
            detail: {
              object: mouseUpObject,
              event: event,
            },
          });
          mount.dispatchEvent(e);
        }
      }

      // 清除 mouseDownObject
      mouseDownObject = null;
    };
    // 添加事件监听器
    mount.addEventListener('mousedown', onMouseDown, false);
    mount.addEventListener('mouseup', onMouseUp, false);

    // 处理鼠标点击事件
    const handleMouseClick = (event: MouseEvent) => {
      if (!mount || !raycasterRef.current) return;

      // 将鼠标位置归一化到设备坐标 (-1到1)
      const rect = mount.getBoundingClientRect();
      //   console.log('rect', rect);
      mouseRef.current.x =
        ((event.clientX - rect.left) / mount.clientWidth) * 2 - 1;
      mouseRef.current.y =
        -((event.clientY - rect.top) / mount.clientHeight) * 2 + 1;
      console.log('mouseRef.current', mouseRef.current);
      // 更新射线投射器
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      // 可视化射线
    //   visualizeRaycaster(raycasterRef.current, scene);
      // 检测交互对象
      const intersects = raycasterRef.current.intersectObjects(
        meshObjects,
        false,
      );

      if (intersects.length > 0) {
        // 确保点击到的是模型，而不是网格
        const clickedObject = intersects.find(
          (obj: any) => obj.object.type === 'Mesh',
        );
        if (clickedObject) {
          // 重置之前的高亮对象材质
          resetCurrentSelectedObject();

          // 高亮当前选中的对象
          const selectedObject = clickedObject.object as THREE.Mesh;
          selectedObjectRef.current = selectedObject;
          selectedObject.userData.originalMaterial = selectedObject.material;
          selectedObject.material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5,
          });
        } else {
          // 未点击到任何对象，重置高亮对象为null
          resetCurrentSelectedObject();
        }
      } else {
        // 未点击到任何对象，重置高亮对象为null
        resetCurrentSelectedObject();
      }
    };

    // mount.addEventListener('click', handleMouseClick);
    mount.addEventListener('click-in-canvas', (event: any) => {
      handleMouseClick(event.detail.event);
    });
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeEventListener('click', handleMouseClick);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default ThreeScene;

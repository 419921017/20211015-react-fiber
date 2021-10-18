import React from 'react';
import ReactDOM from 'react-dom';

// let Element = (
//   <div id="A1">
//     A1
//     <div id="B1">
//       B1
//       <div id="C1">C1</div>
//       <div id="C2">C2</div>
//     </div>
//     <div id="B2">B2</div>
//   </div>
// );
// console.log(JSON.stringify(Element, null, 2));
// ReactDOM.render(Element, document.getElementById('root'));

// function render(element, parentDOM) {
//   let dom = document.createElement(element.type);
//   Object.keys(element.props)
//     .filter((key) => key !== 'children')
//     .forEach((key) => {
//       dom[key] = element.props[key];
//     });

//   if (Array.isArray(element.props.children)) {
//     element.props.children.forEach((child) => render(child, dom));
//   }
//   parentDOM.appendChild(dom);
// }

let A1 = { type: 'div', props: { id: 'A1' } };
let B1 = { type: 'div', props: { id: 'B1' }, return: A1 };
let B2 = { type: 'div', props: { id: 'B2' }, return: A1 };
let C1 = { type: 'div', props: { id: 'C1' }, return: B1 };
let C2 = { type: 'div', props: { id: 'C2' }, return: B1 };

A1.child = B1;
B1.sibling = B2;
B1.child = C1;
C1.sibling = C2;

let container = document.getElementById('root');

let workingInProgressRoot = {
  stateNode: container, //
  props: { children: [A1] },
  //   child
  //   return
  //   sibling
};

//下一个工作单元
let nextUnitOfWork = workingInProgressRoot;

function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 0) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  if (!nextUnitOfWork) {
    commitRoot();
  }
}

/**
 * beginWork 1.创建此fiber的真实DOM, 通过虚拟DOM创建fiber树结构
 *
 * @param {*} workingInProgressFiber
 */
function performUnitOfWork(workingInProgressFiber) {
  beginWork(workingInProgressFiber);
  if (workingInProgressFiber.child) {
    return workingInProgressFiber.child;
  }
  while (workingInProgressFiber) {
    // 如果没有子节点, 意味着此节点已经完成
    completeUnitOfWork(workingInProgressFiber);
    if (workingInProgressFiber.sibling) {
      return workingInProgressFiber.sibling;
    }
    workingInProgressFiber = workingInProgressFiber.return;
  }
}

function beginWork(workingInProgressFiber) {
  console.log('beginWork', workingInProgressFiber.props.id);
  if (!workingInProgressFiber.stateNode) {
    // 在beginWork中不会挂载节点, 只会创建节点
    workingInProgressFiber.stateNode = document.createElement(
      workingInProgressFiber.type
    );
    for (let key in workingInProgressFiber.props) {
      if (key !== 'children') {
        workingInProgressFiber.stateNode[key] =
          workingInProgressFiber.props[key];
      }
    }
  }
  let previousFiber;
  if (
    workingInProgressFiber.props.children &&
    Array.isArray(workingInProgressFiber.props.children)
  ) {
    workingInProgressFiber.props.children.forEach((child, index) => {
      let childFiber = {
        type: child.type,
        props: child.props,
        return: workingInProgressFiber,
        effectTag: 'PLACEMENT',
        nextEffect: null,
      };
      if (index === 0) {
        workingInProgressFiber.child = childFiber;
      } else {
        previousFiber.sibling = childFiber;
      }
      previousFiber = childFiber;
    });
  }
}

function completeUnitOfWork(workingInProgressFiber) {
  console.log('completeUnitOfWork', workingInProgressFiber.props.id);
  // 构建副作用链effectList, 只有有副作用的节点(effectTag不为null的节点),
  let returnFiber = workingInProgressFiber.return;
  if (returnFiber) {
    // 当前fiber有副作用的子链表挂载到父fiber上
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = workingInProgressFiber.firstEffect;
    }
    if (workingInProgressFiber.lastEffect) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = workingInProgressFiber.firstEffect;
      }
      returnFiber.lastEffect = workingInProgressFiber.lastEffect;
    }
    // 把自己挂载到链表后面
    if (workingInProgressFiber.effectTag) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = workingInProgressFiber;
      } else {
        returnFiber.firstEffect = workingInProgressFiber;
      }
      returnFiber.lastEffect = workingInProgressFiber;
    }
  }
}

function commitRoot() {
  let currentFiber = workLoop.firstEffect;
  while (currentFiber) {
    console.log('commitRoot', currentFiber.props.id);
    if (currentFiber.effectTag === 'PLACEMENT') {
      currentFiber.return.stateNode.appendChild(currentFiber.stateNode);
    }
    currentFiber = currentFiber.nextEffect;
  }
  workingInProgressRoot = null;
}

// 在浏览器空闲的时候执行workLoop
requestIdleCallback(workLoop);

// Global type declarations for JSX components
declare module '*.jsx' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '*.tsx' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '*.js' {
  const component: any;
  export default component;
}

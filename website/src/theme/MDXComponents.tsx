import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import type MDXComponentsType from '@theme/MDXComponents';
import SkillHeader from '../components/SkillHeader';
import InstallTabs from '../components/InstallTabs';

const CustomMDXComponents: typeof MDXComponentsType = {
  ...MDXComponents,
  SkillHeader,
  InstallTabs,
  wrapper: ({ children }) => (
    <div className="win31-doc-content">{children}</div>
  ),
};

export default CustomMDXComponents;

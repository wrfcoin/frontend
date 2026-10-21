import React from 'react';
import { isPublicTestnetPath } from '../config/contractSurfacePolicy';

/**
 * Drop every <Route> whose path the public-testnet policy rejects, recursing
 * through fragments and nested routes. Lives outside App.jsx so the computed
 * route set can be tested against the real route modules.
 */
export function filterPublicRouteNodes(
  nodes,
  isFullStudioEnabledFlag,
  isPublicReadonlyEnabledFlag,
  isOperatorPreviewEnabledFlag = false,
) {
  return React.Children.toArray(nodes).flatMap(node => {
    if (!React.isValidElement(node)) {
      return [];
    }

    if (node.type === React.Fragment) {
      const filteredChildren = filterPublicRouteNodes(
        node.props.children,
        isFullStudioEnabledFlag,
        isPublicReadonlyEnabledFlag,
        isOperatorPreviewEnabledFlag,
      );
      return filteredChildren.length === 0
        ? []
        : [React.cloneElement(node, { children: filteredChildren })];
    }

    const path = node.props?.path;
    if (
      typeof path === 'string' &&
      !isPublicTestnetPath(
        path,
        isFullStudioEnabledFlag,
        isPublicReadonlyEnabledFlag,
        isOperatorPreviewEnabledFlag,
      )
    ) {
      return [];
    }

    if (!node.props?.children) {
      return [node];
    }

    const filteredChildren = filterPublicRouteNodes(
      node.props.children,
      isFullStudioEnabledFlag,
      isPublicReadonlyEnabledFlag,
      isOperatorPreviewEnabledFlag,
    );

    if (filteredChildren.length === 0) {
      return [];
    }

    return [
      React.cloneElement(node, {
        ...node.props,
        children: filteredChildren,
      }),
    ];
  });
}

/** Flatten a (filtered) route tree into the list of its string paths. */
export function collectRoutePaths(nodes) {
  return React.Children.toArray(nodes).flatMap(node => {
    if (!React.isValidElement(node)) {
      return [];
    }
    const own = typeof node.props?.path === 'string' ? [node.props.path] : [];
    return [...own, ...collectRoutePaths(node.props?.children)];
  });
}

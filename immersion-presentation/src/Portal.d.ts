import React from 'react';
declare type PortalProps = {
    children: React.ReactNode;
    zoomin?: boolean;
    zoomout?: boolean;
    [key: string]: any;
};
export default function Portal({ children, zoomin, zoomout, className, ...props }: PortalProps): React.ReactNode;
export {};

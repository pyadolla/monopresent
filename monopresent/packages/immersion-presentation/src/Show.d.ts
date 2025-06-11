import React from 'react';
declare type ShowProps = {
    when: boolean;
    children: React.ReactNode;
    opacity?: number;
};
export default function Show({ when, children, opacity }: ShowProps): React.ReactElement;
export {};

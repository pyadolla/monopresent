import React from 'react';
import { PresentationProps } from '../../Presentation';
import './styles.css';
export declare function Presentation(props: PresentationProps): React.ReactElement;
export declare function Slide({ className, children, style: slideStyle, ...props }: {
    className?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    [key: string]: any;
}): React.ReactElement;
export declare function OverviewSlide({ image, title, section, children, styles }: {
    title?: React.ReactNode;
    image?: React.ReactNode;
    section?: string;
    children?: React.ReactNode;
    styles?: {
        title?: React.CSSProperties;
        activeSection?: React.CSSProperties;
        section?: React.CSSProperties;
    };
}): React.ReactElement;
export declare function QuestionSlide({ title, children }: {
    title: React.ReactNode;
    children: React.ReactNode;
}): React.ReactElement;
export declare function List({ children, step, ...props }: {
    children: React.ReactNode;
    step: number;
    [key: string]: any;
}): React.ReactElement;
export declare function Item({ children, name, ...props }: {
    children: React.ReactNode;
    name?: React.ReactNode;
    style?: React.CSSProperties;
    [key: string]: any;
}): React.ReactElement;
export declare function Cite({ id, hidden }: {
    id: string;
    hidden?: boolean;
}): React.ReactElement;
export declare function BibliographySlide(): React.ReactElement;
declare type BoxProps = {
    title?: string;
    children: React.ReactNode;
    className?: string;
    smallTitle?: boolean;
    style?: React.CSSProperties;
};
export declare function Box({ title, children, className, smallTitle, style }: BoxProps): React.ReactElement;
export declare function Qed(props: React.HTMLProps<HTMLDivElement>): React.ReactElement;
export {};

import React from 'react';
import './AnimationEditor.css';
declare type AnimationEditorProps = {
    animations: {
        start: string;
        end: string;
    }[];
};
export declare const lookupAnimationGroups: (start: string, end: string) => string[];
export default function AnimationEditor({ animations: playedAnimations }: AnimationEditorProps): React.ReactElement;
export {};

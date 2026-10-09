# Roadmap

Purpose: distinguish the current delivery from future work. These items are not authorization to implement future features.

## Current milestone — static reference implementation & component system

The AI development framework, two-view authentication UI, 3D tactile buttons (`IsometricButton` with downside extrusion), 3D glass prism input fields, DesignPass spring-physics component suite, extensible component registry, and live Component Gallery (`#/components`) are fully implemented and verified with 100% green Playwright checks.

## Future milestone — authentication requirements

When requested, establish backend ownership, validation rules, account identity semantics, API contracts, failure and loading states, password handling, session strategy, logout, recovery, and protected navigation. Select security controls with the backend requirements; do not embed an assumed token strategy now.

## Future milestone — product expansion

Add authorized application pages through feature boundaries. Introduce routing or shared state only when multiple screens or features need them. Extend the design system through documented components and verified use cases.

## Future milestone — production delivery

Choose a hosting target, build and release automation, monitoring, and operational ownership when deployment is requested. A database and production deployment remain outside the current task.

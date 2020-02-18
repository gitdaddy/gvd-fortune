#ifndef NODE_INSERT_HH
#define NODE_INSERT_HH

#include <memory>
#include "types.hh"

std::shared_ptr<Node> generateSubTree(EventPacket const& e,
                                      std::shared_ptr<Node> arcNode,
                                      std::shared_ptr<Node> optChild);

#endif
